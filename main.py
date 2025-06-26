#!/usr/bin/env python3
"""Burnt Beats production deployment manager."""

import os
import subprocess
import sys
import time
import logging
import socket
from typing import Optional, Dict, List, NoReturn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('deployment.log')
    ]
)
logger = logging.getLogger(__name__)


class DeploymentManager:
    """Manage the deployment process for Burnt Beats production environment."""

    def __init__(self) -> None:
        """Initialize deployment configuration."""
        self.env_vars: Dict[str, str] = {
            "NODE_ENV": "production",
            "PORT": os.environ.get("PORT", "5000"),
            "LOG_LEVEL": "info"
        }
        self.build_timeout: int = 300  # seconds
        self.start_timeout: int = 120  # seconds
        self.max_retries: int = 3
        self.retry_delay: int = 5  # seconds

    def set_environment(self) -> None:
        """Set production environment variables."""
        logger.info("Setting production environment")
        for key, value in self.env_vars.items():
            os.environ[key] = value
            logger.debug("Set %s=%s", key, value)

    def run_command(
        self,
        cmd: List[str],
        cwd: Optional[str] = None
    ) -> bool:
        """
        Run a shell command with retries and timeout.

        Args:
            cmd: Command to execute as list of strings
            cwd: Working directory for command execution

        Returns:
            bool: True if command succeeded, False otherwise

        Raises:
            subprocess.TimeoutExpired: If command times out on final attempt
            subprocess.CalledProcessError: If command fails on final attempt
        """
        for attempt in range(1, self.max_retries + 1):
            try:
                logger.info(
                    "Running command (attempt %d/%d): %s",
                    attempt,
                    self.max_retries,
                    " ".join(cmd)
                )
                result = subprocess.run(
                    cmd,
                    cwd=cwd,
                    check=True,
                    timeout=self.build_timeout if "build" in cmd[0] else self.start_timeout,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                logger.debug("Command output:\n%s", result.stdout)
                return True
            except subprocess.TimeoutExpired:
                logger.error("Command timed out after %d seconds", self.build_timeout)
                if attempt == self.max_retries:
                    raise
            except subprocess.CalledProcessError as e:
                logger.error("Command failed with exit code %d", e.returncode)
                logger.error("Error output:\n%s", e.stderr)
                if attempt == self.max_retries:
                    raise
            except Exception as e:
                logger.error("Unexpected error: %s", str(e))
                if attempt == self.max_retries:
                    raise

            if attempt < self.max_retries:
                logger.info("Retrying in %d seconds...", self.retry_delay)
                time.sleep(self.retry_delay)

        return False

    def build_server(self) -> None:
        """Build the server bundle if it doesn't exist."""
        if os.path.exists("dist/index.cjs"):
            logger.info("Server bundle already exists, skipping build")
            return

        logger.info("Building server bundle")
        build_cmd = [
            "npx", "esbuild", "server/index.ts",
            "--bundle", "--platform=node", "--target=node20",
            "--format=cjs", "--outfile=dist/index.cjs",
            "--external:pg-native", "--external:bufferutil",
            "--external:utf-8-validate", "--external:fsevents",
            "--minify", "--sourcemap", "--log-level=warning"
        ]

        if not self.run_command(build_cmd):
            raise RuntimeError("Failed to build server after multiple attempts")

        # Verify build output
        if not os.path.exists("dist/index.cjs"):
            raise FileNotFoundError("Build failed - dist/index.cjs not created")

        build_size = os.path.getsize("dist/index.cjs") / 1024  # KB
        logger.info("Server bundle created successfully (%.1f KB)", build_size)

    def ensure_directories(self) -> None:
        """Ensure required directories exist."""
        required_dirs = [
            "dist",
            "dist/uploads",
            "dist/public",
            "logs"
        ]

        for dir_path in required_dirs:
            try:
                os.makedirs(dir_path, exist_ok=True)
                logger.debug("Created directory: %s", dir_path)
            except Exception as e:
                logger.error("Failed to create directory %s: %s", dir_path, str(e))
                raise

    def start_server(self) -> None:
        """Start the production server."""
        logger.info("Starting production server")

        if not os.path.exists("dist/index.cjs"):
            raise FileNotFoundError("Server bundle not found in dist directory")

        # Verify port availability
        if self.is_port_in_use(int(self.env_vars["PORT"])):
            raise RuntimeError(f"Port {self.env_vars['PORT']} is already in use")

        start_cmd = ["node", "index.cjs"]
        if not self.run_command(start_cmd, cwd="dist"):
            raise RuntimeError("Failed to start server after multiple attempts")

    @staticmethod
    def is_port_in_use(port: int) -> bool:
        """Check if a port is already in use.

        Args:
            port: Port number to check

        Returns:
            bool: True if port is in use, False otherwise
        """
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            return sock.connect_ex(('localhost', port)) == 0

    def cleanup(self) -> None:
        """Cleanup resources before exit."""
        logger.info("Cleaning up resources")
        # Add any cleanup logic here

    def run(self) -> None:
        """Execute main deployment workflow."""
        try:
            self.set_environment()
            self.ensure_directories()
            self.build_server()
            self.start_server()
        except KeyboardInterrupt:
            logger.info("Received interrupt signal, shutting down...")
            self.cleanup()
            sys.exit(0)
        except Exception as e:
            logger.error("Deployment failed: %s", str(e))
            self.cleanup()
            sys.exit(1)


def main() -> NoReturn:
    """Entry point for deployment script."""
    logger.info("Burnt Beats production deployment starting")
    deployer = DeploymentManager()
    deployer.run()


if __name__ == "__main__":
    main()

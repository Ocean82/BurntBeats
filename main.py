#!/usr/bin/env python3

import os
import subprocess
import sys

def main():
    # Set production environment
    os.environ["NODE_ENV"] = "production"
    os.environ["PORT"] = os.environ.get("PORT", "5000")
    
    print("Starting Burnt Beats production deployment...")
    
    # Ensure build exists
    if not os.path.exists("dist/index.cjs"):
        print("Building server...")
        subprocess.run([
            "npx", "esbuild", "server/index.ts",
            "--bundle", "--platform=node", "--target=node20",
            "--format=cjs", "--outfile=dist/index.cjs",
            "--external:pg-native", "--external:bufferutil",
            "--external:utf-8-validate", "--external:fsevents",
            "--minify"
        ], check=True)
    
    # Ensure directories exist
    os.makedirs("dist/uploads", exist_ok=True)
    
    # Start server
    os.chdir("dist")
    subprocess.run(["node", "index.cjs"], check=True)

if __name__ == "__main__":
    main()
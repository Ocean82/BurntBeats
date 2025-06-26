const fs = require('fs');
const { execSync } = require('child_process');

// Create proper .replit file with deployment section
const replitConfig = `run = "npm start"
modules = ["nodejs-20"]

[deployment]
run = ["npm", "start"]
deploymentTarget = "cloudrun"
build = ["npm", "run", "build"]

[env]
NODE_ENV = "production"
PORT = "5000"

[[ports]]
localPort = 5000
externalPort = 80
`;

// Create Cloud Run deployment configuration
const cloudRunConfig = {
  "apiVersion": "serving.knative.dev/v1",
  "kind": "Service",
  "metadata": {
    "name": "burnt-beats",
    "annotations": {
      "run.googleapis.com/ingress": "all"
    }
  },
  "spec": {
    "template": {
      "metadata": {
        "annotations": {
          "run.googleapis.com/execution-environment": "gen2"
        }
      },
      "spec": {
        "containers": [{
          "image": "gcr.io/PROJECT_ID/burnt-beats",
          "ports": [{
            "containerPort": 5000
          }],
          "env": [{
            "name": "NODE_ENV",
            "value": "production"
          }, {
            "name": "PORT",
            "value": "5000"
          }],
          "resources": {
            "limits": {
              "cpu": "1000m",
              "memory": "2Gi"
            }
          }
        }]
      }
    }
  }
};

// Ensure production build
if (!fs.existsSync('dist/index.cjs')) {
  console.log('Building production server...');
  execSync('npx esbuild server/index.ts --bundle --platform=node --target=node20 --format=cjs --outfile=dist/index.cjs --external:pg-native --external:bufferutil --external:utf-8-validate --external:fsevents --minify', { stdio: 'inherit' });
}

// Create deployment files
fs.writeFileSync('.replit', replitConfig);
fs.writeFileSync('cloud-run.yaml', JSON.stringify(cloudRunConfig, null, 2));

console.log('Deployment configuration fixed:');
console.log('✓ .replit file with proper deployment section');
console.log('✓ Cloud Run configuration');
console.log('✓ Production build ready');
console.log('✓ Valid run command configured');
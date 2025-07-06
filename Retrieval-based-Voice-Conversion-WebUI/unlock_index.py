
#!/usr/bin/env python3
"""
Index management and unlock utility for RVC
Handles FAISS index operations for voice conversion
"""

import os
import sys
import logging
import numpy as np
import faiss
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class IndexManager:
    def __init__(self, model_path=None):
        self.model_path = model_path or "logs"
        self.index_path = None
        
    def find_index_files(self):
        """Find all index files in the model directory"""
        index_files = []
        for root, dirs, files in os.walk(self.model_path):
            for file in files:
                if file.endswith('.index'):
                    index_files.append(os.path.join(root, file))
        return index_files
    
    def load_index(self, index_path):
        """Load a FAISS index file"""
        try:
            if not os.path.exists(index_path):
                logger.error(f"Index file not found: {index_path}")
                return None
                
            index = faiss.read_index(index_path)
            logger.info(f"Successfully loaded index: {index_path}")
            logger.info(f"Index type: {type(index)}")
            logger.info(f"Index dimension: {index.d}")
            logger.info(f"Index size: {index.ntotal}")
            
            self.index_path = index_path
            return index
            
        except Exception as e:
            logger.error(f"Error loading index {index_path}: {str(e)}")
            return None
    
    def unlock_index(self, index_path=None):
        """Unlock and validate index functionality"""
        if index_path:
            self.index_path = index_path
        
        if not self.index_path:
            # Find available index files
            available_indices = self.find_index_files()
            if not available_indices:
                logger.error("No index files found. Please train an index first.")
                return False
            
            logger.info("Available index files:")
            for i, idx_file in enumerate(available_indices):
                logger.info(f"{i}: {idx_file}")
            
            # Use the first available index
            self.index_path = available_indices[0]
            logger.info(f"Using index: {self.index_path}")
        
        # Load and validate the index
        index = self.load_index(self.index_path)
        if index is None:
            return False
        
        # Test index functionality
        try:
            # Create a test query vector
            test_vector = np.random.random((1, index.d)).astype(np.float32)
            
            # Search for similar vectors
            distances, indices = index.search(test_vector, min(10, index.ntotal))
            
            logger.info("Index unlock successful!")
            logger.info(f"Test search completed - found {len(indices[0])} results")
            logger.info(f"Sample distances: {distances[0][:3]}")
            
            return True
            
        except Exception as e:
            logger.error(f"Index validation failed: {str(e)}")
            return False
    
    def get_index_info(self):
        """Get detailed information about the current index"""
        if not self.index_path or not os.path.exists(self.index_path):
            logger.error("No valid index loaded")
            return None
        
        try:
            index = faiss.read_index(self.index_path)
            
            info = {
                "path": self.index_path,
                "type": str(type(index)),
                "dimension": index.d,
                "total_vectors": index.ntotal,
                "is_trained": index.is_trained,
                "file_size": os.path.getsize(self.index_path)
            }
            
            # Try to get IVF-specific info
            try:
                if hasattr(index, 'nlist'):
                    info["nlist"] = index.nlist
                if hasattr(index, 'nprobe'):
                    info["nprobe"] = index.nprobe
            except:
                pass
            
            return info
            
        except Exception as e:
            logger.error(f"Error getting index info: {str(e)}")
            return None

def main():
    """Main function to unlock index"""
    import argparse
    
    parser = argparse.ArgumentParser(description="RVC Index Manager")
    parser.add_argument("--model-path", default="logs", help="Path to model directory")
    parser.add_argument("--index-path", help="Specific index file to unlock")
    parser.add_argument("--info", action="store_true", help="Show index information")
    parser.add_argument("--list", action="store_true", help="List available indices")
    
    args = parser.parse_args()
    
    manager = IndexManager(args.model_path)
    
    if args.list:
        indices = manager.find_index_files()
        if indices:
            logger.info("Available index files:")
            for idx in indices:
                logger.info(f"  - {idx}")
        else:
            logger.info("No index files found")
        return
    
    if args.info:
        if args.index_path:
            manager.index_path = args.index_path
        info = manager.get_index_info()
        if info:
            logger.info("Index Information:")
            for key, value in info.items():
                logger.info(f"  {key}: {value}")
        return
    
    # Default action: unlock index
    success = manager.unlock_index(args.index_path)
    if success:
        logger.info("Index successfully unlocked and ready for use!")
        
        # Show index info
        info = manager.get_index_info()
        if info:
            logger.info("\nIndex Details:")
            logger.info(f"  Vectors: {info['total_vectors']}")
            logger.info(f"  Dimension: {info['dimension']}")
            logger.info(f"  File size: {info['file_size'] / (1024*1024):.2f} MB")
    else:
        logger.error("Failed to unlock index")
        sys.exit(1)

if __name__ == "__main__":
    main()

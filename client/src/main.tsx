import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Get the root DOM element
const rootElement = document.getElementById('root');

// Check if the root element exists
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Create a root and render the app
const root = createRoot(rootElement);
root.render(<App />);

// Optional: Add error boundary for the root component
if (process.env.NODE_ENV === 'production') {
  rootElement.addEventListener('error', (event) => {
    console.error('Root error:', event.error);
    // You could render a fallback UI here if needed
  });
}

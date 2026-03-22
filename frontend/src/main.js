import { P5Engine } from './engine.js';

const form = document.getElementById('prompt-form');
const input = document.getElementById('prompt-input');
const btnText = document.querySelector('.btn-text');
const loader = document.getElementById('loader');
const emptyState = document.getElementById('empty-state');

const engine = new P5Engine('canvas-container');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const prompt = input.value.trim();
  if (!prompt) return;

  // Toggle Loading State
  btnText.classList.add('hidden');
  loader.classList.remove('loader-hidden');
  input.disabled = true;

  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const sceneSpec = await response.json();
    console.log("Agent Generated Spec:", sceneSpec);

    // Hide empty state on successful fetch
    emptyState.classList.add('hidden');
    
    // Inject specification to p5 instance
    engine.loadSpec(sceneSpec);

  } catch (error) {
    console.error("Failed to generate scene:", error);
    alert("Error communicating with AI agent. Make sure the backend expresses are running on port 3000.");
  } finally {
    // Revert Loading State
    btnText.classList.remove('hidden');
    loader.classList.add('loader-hidden');
    input.disabled = false;
    input.focus();
  }
});

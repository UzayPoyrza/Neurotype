import { mentalHealthModules } from '../data/modules';

// Helper function to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Helper function to convert RGB to hex
const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

// Helper function to interpolate between two colors
const interpolateColor = (color1: string, color2: string, factor: number): string => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
  
  return rgbToHex(r, g, b);
};

// Create a darker version of a color
const darkenColor = (color: string, factor: number = 0.3): string => {
  const rgb = hexToRgb(color);
  return rgbToHex(
    Math.round(rgb.r * (1 - factor)),
    Math.round(rgb.g * (1 - factor)),
    Math.round(rgb.b * (1 - factor))
  );
};

// Create a much darker version for better text contrast
const darkenColorForBackground = (color: string, factor: number = 0.6): string => {
  const rgb = hexToRgb(color);
  return rgbToHex(
    Math.round(rgb.r * (1 - factor)),
    Math.round(rgb.g * (1 - factor)),
    Math.round(rgb.b * (1 - factor))
  );
};

// Create a lighter version of a color
const lightenColor = (color: string, factor: number = 0.2): string => {
  const rgb = hexToRgb(color);
  return rgbToHex(
    Math.round(rgb.r + (255 - rgb.r) * factor),
    Math.round(rgb.g + (255 - rgb.g) * factor),
    Math.round(rgb.b + (255 - rgb.b) * factor)
  );
};

// Create subtle variations within a module based on session progress
export const createModuleVariation = (moduleColor: string, progress: number): string => {
  // Progress is 0-1, we want subtle variations
  const variationFactor = (progress - 0.5) * 0.05; // -0.025 to 0.025 (reduced for darker backgrounds)
  
  if (variationFactor > 0) {
    // Slightly lighter as progress increases
    return lightenColor(moduleColor, Math.abs(variationFactor));
  } else {
    // Slightly darker as progress decreases
    return darkenColor(moduleColor, Math.abs(variationFactor));
  }
};

// Create Spotify-style gradient colors (darker bottom, lighter top)
export const createSpotifyGradient = (baseColor: string): { top: string; bottom: string } => {
  // Start with a much darker base for better text contrast
  const darkBase = darkenColorForBackground(baseColor, 0.5);
  
  const topColor = lightenColor(darkBase, 0.1); // Slightly lighter at top
  const bottomColor = darkenColor(darkBase, 0.2); // Even darker at bottom
  
  return { top: topColor, bottom: bottomColor };
};

// Map session goals to module IDs
const goalToModuleMap: Record<string, string> = {
  'anxiety': 'anxiety',
  'focus': 'adhd', // Using ADHD module for focus
  'sleep': 'sleep'
};

// Get module color by ID
export const getModuleColor = (moduleId: string): string => {
  const module = mentalHealthModules.find(m => m.id === moduleId);
  return module ? module.color : '#1a1a1a'; // Default dark color
};

// Get module color by goal
export const getModuleColorByGoal = (goal: string): string => {
  const moduleId = goalToModuleMap[goal] || 'anxiety';
  return getModuleColor(moduleId);
};

// Create complete gradient background for meditation player
export const createMeditationPlayerBackground = (
  moduleIdOrGoal: string, 
  sessionProgress: number = 0
): { top: string; bottom: string; base: string } => {
  // Check if it's a goal (anxiety, focus, sleep) or module ID
  const baseColor = goalToModuleMap[moduleIdOrGoal] 
    ? getModuleColorByGoal(moduleIdOrGoal)
    : getModuleColor(moduleIdOrGoal);
    
  const variedColor = createModuleVariation(baseColor, sessionProgress);
  const gradient = createSpotifyGradient(variedColor);
  
  return {
    top: gradient.top,
    bottom: gradient.bottom,
    base: variedColor
  };
};

// Pre-calculate all module gradients for performance
export const prerenderedModuleGradients: Record<string, { top: string; bottom: string; base: string }> = {};

mentalHealthModules.forEach(module => {
  prerenderedModuleGradients[module.id] = createMeditationPlayerBackground(module.id, 0.5);
});

// Get prerendered gradient for a module
export const getPrerenderedGradient = (moduleId: string): { top: string; bottom: string; base: string } => {
  return prerenderedModuleGradients[moduleId] || prerenderedModuleGradients['anxiety'];
};

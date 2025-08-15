// Theme Testing Script
// Run this in browser console to test theme functionality

function testThemeSystem() {
  console.log('🎨 Testing Holool Medical Devices Theme System...');
  
  // Check if theme context is available
  const root = document.documentElement;
  const themeToggle = document.querySelector('[data-theme-toggle]');
  
  console.log('🔍 Current CSS Variables:');
  const cssVars = {
    background: getComputedStyle(root).getPropertyValue('--background'),
    primary: getComputedStyle(root).getPropertyValue('--primary'),
    accent: getComputedStyle(root).getPropertyValue('--accent'),
    glassBackground: getComputedStyle(root).getPropertyValue('--glass-bg'),
  };
  console.table(cssVars);
  
  console.log('🔍 Current HTML Classes:');
  console.log('Classes:', Array.from(root.classList));
  
  // Test localStorage
  const storedTheme = localStorage.getItem('holool-theme');
  console.log('💾 Stored Theme:', storedTheme);
  
  // Test theme switching programmatically
  console.log('🧪 Testing Theme Switches...');
  
  // Store original theme
  const originalClasses = Array.from(root.classList);
  
  // Test dark mode
  root.classList.remove('light', 'dark');
  root.classList.add('dark');
  console.log('🌙 Dark mode CSS vars:', {
    background: getComputedStyle(root).getPropertyValue('--background'),
    primary: getComputedStyle(root).getPropertyValue('--primary'),
  });
  
  // Test light mode
  root.classList.remove('light', 'dark');
  root.classList.add('light');
  console.log('☀️ Light mode CSS vars:', {
    background: getComputedStyle(root).getPropertyValue('--background'),
    primary: getComputedStyle(root).getPropertyValue('--primary'),
  });
  
  // Restore original state
  root.className = originalClasses.join(' ');
  
  console.log('✅ Theme system test completed!');
  
  return {
    hasThemeSystem: !!storedTheme || root.classList.contains('light') || root.classList.contains('dark'),
    cssVariables: cssVars,
    storedTheme,
    currentClasses: Array.from(root.classList)
  };
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  testThemeSystem();
}

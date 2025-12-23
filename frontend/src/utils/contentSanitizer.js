/**
 * Sanitizes and cleans HTML content for display
 * Removes unwanted elements and fixes common issues
 */
export function sanitizeContent(html) {
  if (!html) return '';
  
  // Check if we're in a browser environment
  if (typeof document === 'undefined') {
    return html; // Return as-is if not in browser
  }

  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Remove script and style tags
  const scripts = tempDiv.querySelectorAll('script, style, noscript');
  scripts.forEach(el => el.remove());

  // Remove elements with display:none or visibility:hidden
  const hiddenElements = tempDiv.querySelectorAll('[style*="display: none"], [style*="display:none"], [style*="visibility: hidden"], [style*="visibility:hidden"]');
  hiddenElements.forEach(el => el.remove());

  // Preserve and optimize images
  const images = tempDiv.querySelectorAll('img');
  images.forEach(img => {
    // Ensure images are responsive but don't override existing styles unnecessarily
    const currentStyle = img.getAttribute('style') || '';
    if (!currentStyle.includes('max-width')) {
      img.setAttribute('style', `max-width: 100%; height: auto; ${currentStyle}`);
    }
    
    // Add loading="lazy" for performance
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
    
    // Ensure alt text exists for accessibility
    if (!img.hasAttribute('alt')) {
      img.setAttribute('alt', 'Article image');
    }
  });

  // Preserve SVGs - don't modify them, just ensure they're responsive
  const svgs = tempDiv.querySelectorAll('svg');
  svgs.forEach(svg => {
    // Make SVGs responsive
    if (!svg.hasAttribute('style')) {
      svg.setAttribute('style', 'max-width: 100%; height: auto;');
    } else {
      const currentStyle = svg.getAttribute('style');
      if (!currentStyle.includes('max-width')) {
        svg.setAttribute('style', `max-width: 100%; height: auto; ${currentStyle}`);
      }
    }
    
    // Ensure viewBox is set for proper scaling
    if (!svg.hasAttribute('viewBox') && svg.hasAttribute('width') && svg.hasAttribute('height')) {
      const width = svg.getAttribute('width');
      const height = svg.getAttribute('height');
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }
  });

  // Preserve figure elements (often contain images with captions)
  const figures = tempDiv.querySelectorAll('figure');
  figures.forEach(figure => {
    // Ensure figures are styled properly
    if (!figure.hasAttribute('style')) {
      figure.setAttribute('style', 'margin: 1.5rem 0;');
    }
  });

  // Remove empty divs and spans
  const emptyElements = tempDiv.querySelectorAll('div:empty, span:empty');
  emptyElements.forEach(el => {
    // Keep if it has meaningful attributes
    if (!el.hasAttributes() || el.className === '' || el.id === '') {
      el.remove();
    }
  });

  // Fix any elements with extremely large font sizes (likely decorative)
  const allElements = tempDiv.querySelectorAll('*');
  allElements.forEach(el => {
    const style = el.getAttribute('style') || '';
    if (style.includes('font-size')) {
      const fontSizeMatch = style.match(/font-size:\s*(\d+)px/i);
      if (fontSizeMatch && parseInt(fontSizeMatch[1]) > 100) {
        // Reduce extremely large font sizes
        const newStyle = style.replace(/font-size:\s*\d+px/i, 'font-size: 2rem');
        el.setAttribute('style', newStyle);
      }
    }
  });

  return tempDiv.innerHTML;
}

/**
 * Simple text extraction for previews
 */
export function extractText(html) {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}


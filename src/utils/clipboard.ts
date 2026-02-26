/**
 * Copies text to clipboard with fallback support
 * Uses modern Clipboard API when available, falls back to document.execCommand
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Fallback to legacy method first (more reliable in iframes and restricted contexts)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea invisible but still selectable
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    
    document.body.appendChild(textArea);
    
    // Select the text
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      return true;
    }
  } catch (err) {
    console.warn('Legacy copy method failed, trying Clipboard API', err);
  }

  // Try modern Clipboard API as fallback
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Clipboard API also failed', err);
    }
  }
  
  console.error('All clipboard methods failed');
  return false;
}
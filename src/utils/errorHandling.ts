import React from 'react';

/**
 * Utility functions for error handling throughout the application
 */

/**
 * Suppresses YouTube API errors that occur when ad blockers are active
 * This can be used in any component that might interact with YouTube
 */
export const suppressYouTubeErrors = () => {
  // Suppress console.error messages
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const errorMsg = args[0]?.toString() || '';
    // Filter out specific YouTube API errors
    if (
      errorMsg.includes('net::ERR_BLOCKED_BY_CLIENT') ||
      errorMsg.includes('YouTube') || 
      errorMsg.includes('youtube') ||
      errorMsg.includes('google.com/log') ||
      errorMsg.includes('youtubei/v1/log_event')
    ) {
      return; // Suppress these errors
    }
    originalConsoleError(...args);
  };
  
  // Also suppress console.warn messages
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const warnMsg = args[0]?.toString() || '';
    if (
      warnMsg.includes('net::ERR_BLOCKED_BY_CLIENT') ||
      warnMsg.includes('YouTube') || 
      warnMsg.includes('youtube') ||
      warnMsg.includes('google.com/log') ||
      warnMsg.includes('youtubei/v1/log_event')
    ) {
      return; // Suppress these warnings
    }
    originalConsoleWarn(...args);
  };
  
  // Suppress console.log messages related to YouTube
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    const logMsg = args[0]?.toString() || '';
    if (
      logMsg.includes('net::ERR_BLOCKED_BY_CLIENT') ||
      logMsg.includes('YouTube') || 
      logMsg.includes('youtube') ||
      logMsg.includes('google.com/log') ||
      logMsg.includes('youtubei/v1/log_event')
    ) {
      return; // Suppress these logs
    }
    originalConsoleLog(...args);
  };

  // Capture and suppress fetch errors via unhandled promise rejections
  const originalUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    if (event.reason && event.reason.message) {
      const reasonMsg = event.reason.message.toString();
      if (
        reasonMsg.includes('net::ERR_BLOCKED_BY_CLIENT') ||
        reasonMsg.includes('YouTube') || 
        reasonMsg.includes('youtube') ||
        reasonMsg.includes('google.com/log') ||
        reasonMsg.includes('youtubei/v1/log_event')
      ) {
        event.preventDefault();
        return;
      }
    }
    if (originalUnhandledRejection) originalUnhandledRejection.call(window, event);
  };
  
  // Add an error event listener to capture and suppress YouTube errors
  const handleYoutubeError = (event: ErrorEvent) => {
    if (
      event.message?.includes('net::ERR_BLOCKED_BY_CLIENT') ||
      event.message?.includes('YouTube') || 
      event.message?.includes('youtube') ||
      event.message?.includes('google.com/log') ||
      event.message?.includes('youtubei')
    ) {
      event.preventDefault();
      return true; // Prevents the error from propagating
    }
    return false;
  };
  
  window.addEventListener('error', handleYoutubeError, true);

  // Return a cleanup function that restores original console methods
  return () => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
    window.onunhandledrejection = originalUnhandledRejection;
    window.removeEventListener('error', handleYoutubeError, true);
  };
};

/**
 * Hook to suppress YouTube errors in React components
 */
export const useSuppressYouTubeErrors = () => {
  React.useEffect(() => {
    const cleanup = suppressYouTubeErrors();
    return cleanup;
  }, []);
}; 
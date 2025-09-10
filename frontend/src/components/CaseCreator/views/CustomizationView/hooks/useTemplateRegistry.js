// @/components/CaseCreator/views/CustomizationView/hooks/useTemplateRegistry.js

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  TEMPLATE_REGISTRY,
  getTemplate,
  getTemplatePages,
  getAvailableTemplates
} from '../constants/templateRegistry';

/**
 * Custom hook for managing template loading and navigation
 * FIXED VERSION - Prevents component unmounting issues
 * @param {string} templateId - Initial template ID
 * @param {string} initialPage - Initial page
 * @returns {Object} Template state and handlers
 */
export const useTemplateRegistry = (templateId = 'beacon', initialPage = 'Home') => {
  // Current template and page
  const [currentTemplateId, setCurrentTemplateId] = useState(templateId);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState(null);
  
  // Page navigation history
  const [pageHistory, setPageHistory] = useState([initialPage]);
  const [pageHistoryIndex, setPageHistoryIndex] = useState(0);

  // CRITICAL FIX: Use refs to maintain stable component references
  const componentCacheRef = useRef({});
  const currentComponentRef = useRef(null);

  // Get current template
  const currentTemplate = useMemo(() => {
    return getTemplate(currentTemplateId);
  }, [currentTemplateId]);

  // Get available pages for current template
  const availablePages = useMemo(() => {
    return getTemplatePages(currentTemplateId);
  }, [currentTemplateId]);

  // Get all available templates
  const availableTemplates = useMemo(() => {
    return getAvailableTemplates().map(id => ({
      id,
      ...TEMPLATE_REGISTRY[id]
    }));
  }, []);

  // FIXED: Get current page component with stable reference
  const getCurrentPageComponent = useCallback(() => {
    if (!currentTemplate || !currentTemplate.pages[currentPage]) {
      console.warn(`Page "${currentPage}" not found in template "${currentTemplateId}"`);
      return null;
    }

    // Create a stable cache key
    const cacheKey = `${currentTemplateId}-${currentPage}`;
    
    // Check if we already have this component cached
    if (componentCacheRef.current[cacheKey]) {
      currentComponentRef.current = componentCacheRef.current[cacheKey];
      return componentCacheRef.current[cacheKey];
    }

    // Get the component from the template
    const component = currentTemplate.pages[currentPage];
    
    // Cache it for future use
    componentCacheRef.current[cacheKey] = component;
    currentComponentRef.current = component;
    
    console.log(`Cached component for ${cacheKey}`);
    return component;
  }, [currentTemplate, currentPage, currentTemplateId]);

  // Initialize CurrentPageComponent
  useEffect(() => {
    getCurrentPageComponent();
  }, [getCurrentPageComponent]);

  // Validate page exists in template
  const isValidPage = useCallback((page, templateId = currentTemplateId) => {
    const template = getTemplate(templateId);
    return template && template.pages[page] !== undefined;
  }, [currentTemplateId]);

  // Change current page with validation
  const changePage = useCallback((newPage) => {
    if (!isValidPage(newPage)) {
      console.error(`Page "${newPage}" does not exist in template "${currentTemplateId}"`);
      setTemplateError(`Page "${newPage}" not found`);
      return false;
    }

    console.log(`Changing page from ${currentPage} to ${newPage}`);
    setCurrentPage(newPage);
    setTemplateError(null);

    // Update history
    setPageHistory(prev => {
      const newHistory = prev.slice(0, pageHistoryIndex + 1);
      newHistory.push(newPage);
      return newHistory;
    });
    setPageHistoryIndex(prev => prev + 1);

    return true;
  }, [currentTemplateId, currentPage, pageHistoryIndex, isValidPage]);

  // Navigate through page history
  const navigatePageHistory = useCallback((direction) => {
    if (direction === 'back' && pageHistoryIndex > 0) {
      const newIndex = pageHistoryIndex - 1;
      setPageHistoryIndex(newIndex);
      setCurrentPage(pageHistory[newIndex]);
      return true;
    } else if (direction === 'forward' && pageHistoryIndex < pageHistory.length - 1) {
      const newIndex = pageHistoryIndex + 1;
      setPageHistoryIndex(newIndex);
      setCurrentPage(pageHistory[newIndex]);
      return true;
    }
    return false;
  }, [pageHistory, pageHistoryIndex]);

  // Change template
  const changeTemplate = useCallback(async (newTemplateId, options = {}) => {
    const { 
      resetToFirstPage = true,
      preservePageIfExists = true 
    } = options;

    if (newTemplateId === currentTemplateId) {
      return true;
    }

    setIsLoadingTemplate(true);
    setTemplateError(null);

    try {
      // Check if template exists
      const newTemplate = getTemplate(newTemplateId);
      if (!newTemplate) {
        throw new Error(`Template "${newTemplateId}" not found`);
      }

      // Determine which page to show
      let targetPage = currentPage;
      
      if (preservePageIfExists && !isValidPage(currentPage, newTemplateId)) {
        // Current page doesn't exist in new template
        targetPage = Object.keys(newTemplate.pages)[0] || 'Home';
      } else if (resetToFirstPage) {
        targetPage = Object.keys(newTemplate.pages)[0] || 'Home';
      }

      // Update state
      setCurrentTemplateId(newTemplateId);
      setCurrentPage(targetPage);
      
      // Reset page history
      setPageHistory([targetPage]);
      setPageHistoryIndex(0);

      // Clear component cache for old template to free memory
      // But keep components for the new template if they exist
      const keysToRemove = Object.keys(componentCacheRef.current).filter(
        key => !key.startsWith(newTemplateId)
      );
      keysToRemove.forEach(key => {
        delete componentCacheRef.current[key];
      });

      return true;
    } catch (error) {
      console.error('Failed to change template:', error);
      setTemplateError(error.message);
      return false;
    } finally {
      setIsLoadingTemplate(false);
    }
  }, [currentTemplateId, currentPage, isValidPage]);

  // Get template info
  const getTemplateInfo = useCallback((templateId = currentTemplateId) => {
    const template = TEMPLATE_REGISTRY[templateId];
    if (!template) return null;

    return {
      id: templateId,
      name: template.name,
      description: template.description,
      pageCount: Object.keys(template.pages).length,
      pages: Object.keys(template.pages),
      hasDefaults: !!template.defaultCustomizations,
      cachedComponents: Object.keys(componentCacheRef.current).filter(
        key => key.startsWith(templateId)
      ).length
    };
  }, [currentTemplateId]);

  // Check if a page is enabled (based on customizations)
  const isPageEnabled = useCallback((pageName, customizations) => {
    // Check if page has an 'enabled' field in customizations
    const pageCustomizations = customizations?.customizations?.pages?.[pageName.toLowerCase()];
    
    // If there's no enabled field, assume it's enabled
    if (pageCustomizations?.enabled === undefined) {
      return true;
    }
    
    return pageCustomizations.enabled;
  }, []);

  // Get enabled pages
  const getEnabledPages = useCallback((customizations) => {
    return availablePages.filter(page => 
      isPageEnabled(page, customizations)
    );
  }, [availablePages, isPageEnabled]);

  // Preload all pages for current template
  const preloadTemplatePages = useCallback(async () => {
    if (!currentTemplate) return;

    try {
      // Preload and cache all pages
      for (const [pageName, PageComponent] of Object.entries(currentTemplate.pages)) {
        const cacheKey = `${currentTemplateId}-${pageName}`;
        if (!componentCacheRef.current[cacheKey]) {
          componentCacheRef.current[cacheKey] = PageComponent;
          
          // Trigger lazy loading if it's a lazy component
          if (PageComponent._payload) {
            PageComponent._payload._result || PageComponent();
          }
        }
      }
      
      console.log(`All pages for template "${currentTemplateId}" preloaded and cached`);
    } catch (error) {
      console.error('Failed to preload template pages:', error);
    }
  }, [currentTemplate, currentTemplateId]);

  // Effect to preload pages when template changes
  useEffect(() => {
    preloadTemplatePages();
  }, [preloadTemplatePages]);

  // Navigation helpers
  const canGoBack = pageHistoryIndex > 0;
  const canGoForward = pageHistoryIndex < pageHistory.length - 1;

  const goToFirstPage = useCallback(() => {
    const firstPage = availablePages[0];
    if (firstPage) {
      changePage(firstPage);
    }
  }, [availablePages, changePage]);

  const goToLastPage = useCallback(() => {
    const lastPage = availablePages[availablePages.length - 1];
    if (lastPage) {
      changePage(lastPage);
    }
  }, [availablePages, changePage]);

  const goToNextPage = useCallback(() => {
    const currentIndex = availablePages.indexOf(currentPage);
    if (currentIndex < availablePages.length - 1) {
      changePage(availablePages[currentIndex + 1]);
      return true;
    }
    return false;
  }, [availablePages, currentPage, changePage]);

  const goToPreviousPage = useCallback(() => {
    const currentIndex = availablePages.indexOf(currentPage);
    if (currentIndex > 0) {
      changePage(availablePages[currentIndex - 1]);
      return true;
    }
    return false;
  }, [availablePages, currentPage, changePage]);

  return {
    // Current state
    currentTemplateId,
    currentTemplate,
    currentPage,
    // CRITICAL: Return the stable ref instead of creating new reference
    CurrentPageComponent: currentComponentRef.current,
    availablePages,
    availableTemplates,
    isLoadingTemplate,
    templateError,
    
    // Navigation state
    canGoBack,
    canGoForward,
    pageHistory,
    
    // Actions
    changePage,
    changeTemplate,
    navigatePageHistory,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    
    // Utilities
    isValidPage,
    isPageEnabled,
    getEnabledPages,
    getTemplateInfo,
    preloadTemplatePages
  };
};
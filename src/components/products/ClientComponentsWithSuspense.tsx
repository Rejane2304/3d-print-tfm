/**
 * Client Components with Suspense Wrappers
 * Components that use useSearchParams must be wrapped in Suspense
 */
'use client';

import { Suspense } from 'react';
import SearchBar from './SearchBar';
import FilterSidebar from './FilterSidebar';
import SortSelector from './SortSelector';
import Pagination from './Pagination';

// Wrapper for SearchBar
export function SearchBarWrapper() {
  return (
    <Suspense fallback={<div className="w-full h-12 bg-gray-200 rounded-lg animate-pulse" />}>
      <SearchBar />
    </Suspense>
  );
}

// Wrapper for FilterSidebar
export function FilterSidebarWrapper() {
  return (
    <Suspense fallback={<div className="w-full h-96 bg-gray-200 rounded-lg animate-pulse" />}>
      <FilterSidebar />
    </Suspense>
  );
}

// Wrapper for SortSelector
export function SortSelectorWrapper() {
  return (
    <Suspense fallback={<div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse" />}>
      <SortSelector />
    </Suspense>
  );
}

// Wrapper for Pagination
interface PaginationWrapperProps {
  currentPage: number;
  totalPages: number;
}

export function PaginationWrapper({ currentPage, totalPages }: PaginationWrapperProps) {
  return (
    <Suspense fallback={<div className="w-full h-12 bg-gray-200 rounded-lg animate-pulse" />}>
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </Suspense>
  );
}

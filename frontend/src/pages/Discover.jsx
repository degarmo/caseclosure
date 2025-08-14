import React, { useState, useEffect } from "react";
import { Case } from "@/api/entities";
import CaseCard from "../components/discover/CaseCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Compass, ChevronLeft, ChevronRight } from "lucide-react";

const CASES_PER_PAGE = 9;

export default function Discover() {
  const [allCases, setAllCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    const filtered = allCases.filter(c => 
      c.person_name.toLowerCase().includes(lowercasedTerm) ||
      c.location.toLowerCase().includes(lowercasedTerm) ||
      c.summary.toLowerCase().includes(lowercasedTerm) ||
      (c.tags && c.tags.some(tag => tag.toLowerCase().includes(lowercasedTerm)))
    );
    setFilteredCases(filtered);
    setCurrentPage(1); // Reset to first page on new search
  }, [searchTerm, allCases]);

  const loadCases = async () => {
    setIsLoading(true);
    const fetchedCases = await Case.list('-last_seen_date');
    setAllCases(fetchedCases);
    setFilteredCases(fetchedCases);
    setIsLoading(false);
  };

  const totalPages = Math.ceil(filteredCases.length / CASES_PER_PAGE);
  const currentCases = filteredCases.slice(
    (currentPage - 1) * CASES_PER_PAGE,
    currentPage * CASES_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Compass className="w-8 h-8 text-blue-500" />
          <h1 className="text-4xl lg:text-5xl font-bold gradient-text">Discover Cases</h1>
        </div>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Search for active and past cases. Your awareness can make a difference.
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            type="text"
            placeholder="Search by name, location, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-6 rounded-full text-lg shadow-lg border-2 border-transparent focus:border-orange-200"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array(9).fill(0).map((_, i) => (
            <div key={i} className="bg-white/80 rounded-3xl p-6 animate-pulse">
              <div className="h-64 bg-slate-200 rounded-2xl mb-4" />
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
              <div className="h-12 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {currentCases.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No cases found</h3>
              <p className="text-slate-500">Try adjusting your search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentCases.map((caseData) => (
                <CaseCard key={caseData.id} caseData={caseData} />
              ))}
            </div>
          )}
        </>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-16">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-full px-4 py-2"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
              if (pageNum > totalPages) return null;
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  onClick={() => handlePageChange(pageNum)}
                  className="w-10 h-10 rounded-full p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-full px-4 py-2"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Results summary */}
      <div className="text-center mt-8 text-slate-500">
        Showing {currentCases.length} of {filteredCases.length} cases
        {searchTerm && ` for "${searchTerm}"`}
      </div>
    </div>
  );
}
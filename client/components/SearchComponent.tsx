import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp, 
  Filter,
  MapPin,
  Star,
  Calendar,
  Wrench,
  ShoppingCart
} from "lucide-react";

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'service' | 'product' | 'provider' | 'category';
  icon: React.ReactNode;
  category?: string;
  popularity?: number;
}

interface SearchComponentProps {
  placeholder?: string;
  showSuggestions?: boolean;
  onSearch?: (query: string) => void;
  className?: string;
}

export function SearchComponent({ 
  placeholder = "ابحث عن الأجهزة أو الخدمات...",
  showSuggestions = true,
  onSearch,
  className = ""
}: SearchComponentProps) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Mock popular suggestions
  const popularSuggestions: SearchSuggestion[] = [
    { id: '1', text: 'أجهزة الأشعة السينية', type: 'category', icon: <Calendar className="h-4 w-4" />, popularity: 95 },
    { id: '2', text: 'صيانة أجهزة التنفس', type: 'service', icon: <Wrench className="h-4 w-4" />, popularity: 89 },
    { id: '3', text: 'أجهزة قياس الضغط', type: 'product', icon: <ShoppingCart className="h-4 w-4" />, popularity: 87 },
    { id: '4', text: 'شركة الرعاية المتقدمة', type: 'provider', icon: <Star className="h-4 w-4" />, popularity: 82 },
    { id: '5', text: 'أجهزة المراقبة', type: 'category', icon: <Calendar className="h-4 w-4" />, popularity: 78 },
    { id: '6', text: 'إيجار أجهزة العمليات', type: 'service', icon: <Calendar className="h-4 w-4" />, popularity: 75 }
  ];

  useEffect(() => {
    // Load recent searches from localStorage
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (query.trim()) {
      // Filter suggestions based on query
      const filtered = popularSuggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6);
      setSuggestions(filtered);
    } else {
      setSuggestions(popularSuggestions.slice(0, 6));
    }
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Add to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    // Navigate to search results
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setShowDropdown(false);
    inputRef.current?.blur();

    // Call optional callback
    onSearch?.(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'service': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'product': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'provider': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'category': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'service': return 'خدمة';
      case 'product': return 'منتج';
      case 'provider': return 'مقدم خدمة';
      case 'category': return 'فئة';
      default: return '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full glass rounded-full px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-arabic transition-all duration-300 focus:shadow-lg"
          dir="rtl"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
            onClick={() => setQuery('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-10 top-1/2 transform -translate-y-1/2"
          onClick={() => handleSearch(query)}
        >
          بحث
        </Button>
      </div>

      {/* Search Dropdown */}
      {showDropdown && showSuggestions && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 glass-card max-h-96 overflow-y-auto">
            <CardContent className="p-0">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      البحث الأخير
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="h-6 text-xs"
                    >
                      مسح الكل
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => handleSearch(search)}
                      >
                        {search}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="p-2">
                <div className="flex items-center gap-2 px-2 py-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    اقتراحات شائعة
                  </span>
                </div>
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion.id}
                    variant="ghost"
                    className="w-full justify-start p-2 h-auto"
                    onClick={() => handleSearch(suggestion.text)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0">
                        {suggestion.icon}
                      </div>
                      <div className="flex-1 text-right">
                        <div className="font-medium text-sm">{suggestion.text}</div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getTypeColor(suggestion.type)}`}
                      >
                        {getTypeLabel(suggestion.type)}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default SearchComponent;

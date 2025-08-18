/**
 * Advanced Search Service with Elasticsearch
 * Provides full-text search, filtering, faceting, and suggestions
 */

import { Client } from '@elastic/elasticsearch';
import { monitoring } from '../../client/lib/monitoring';
import { cache } from '../../client/lib/cache';

// Initialize Elasticsearch client
const elasticsearch = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
  },
  maxRetries: 5,
  requestTimeout: 30000,
  sniffOnStart: true,
  sniffInterval: 60000,
  sniffOnConnectionFault: true,
});

// Search types
export interface SearchQuery {
  query: string;
  filters?: SearchFilter[];
  facets?: string[];
  sort?: SearchSort[];
  pagination?: SearchPagination;
  highlight?: boolean;
  suggest?: boolean;
  fuzzy?: boolean;
  boost?: SearchBoost[];
}

export interface SearchFilter {
  field: string;
  value: any;
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'exists' | 'range';
}

export interface SearchSort {
  field: string;
  order: 'asc' | 'desc';
}

export interface SearchPagination {
  page: number;
  size: number;
}

export interface SearchBoost {
  field: string;
  weight: number;
}

export interface SearchResult<T = any> {
  hits: SearchHit<T>[];
  total: number;
  facets?: Record<string, FacetBucket[]>;
  suggestions?: string[];
  took: number;
  maxScore?: number;
}

export interface SearchHit<T = any> {
  id: string;
  score: number;
  source: T;
  highlight?: Record<string, string[]>;
}

export interface FacetBucket {
  key: string;
  count: number;
}

// Index configurations
const INDICES = {
  products: {
    name: 'products',
    mappings: {
      properties: {
        id: { type: 'keyword' },
        name: { type: 'text', analyzer: 'standard' },
        nameAr: { type: 'text', analyzer: 'arabic' },
        description: { type: 'text', analyzer: 'standard' },
        descriptionAr: { type: 'text', analyzer: 'arabic' },
        category: { type: 'keyword' },
        subcategory: { type: 'keyword' },
        brand: { type: 'keyword' },
        model: { type: 'keyword' },
        sku: { type: 'keyword' },
        price: { type: 'float' },
        currency: { type: 'keyword' },
        stockQuantity: { type: 'integer' },
        tags: { type: 'keyword' },
        specifications: { type: 'object', enabled: false },
        certifications: { type: 'keyword' },
        supplierId: { type: 'keyword' },
        rating: { type: 'float' },
        reviewCount: { type: 'integer' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        isActive: { type: 'boolean' },
        suggest: {
          type: 'completion',
          analyzer: 'simple',
          search_analyzer: 'simple',
        },
      },
    },
    settings: {
      number_of_shards: 2,
      number_of_replicas: 1,
      analysis: {
        analyzer: {
          arabic: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'arabic_normalization', 'arabic_stemmer'],
          },
        },
        filter: {
          arabic_stemmer: {
            type: 'stemmer',
            language: 'arabic',
          },
        },
      },
    },
  },
  users: {
    name: 'users',
    mappings: {
      properties: {
        id: { type: 'keyword' },
        email: { type: 'keyword' },
        firstName: { type: 'text' },
        lastName: { type: 'text' },
        userType: { type: 'keyword' },
        status: { type: 'keyword' },
        organizationName: { type: 'text' },
        specializations: { type: 'keyword' },
        location: { type: 'geo_point' },
        createdAt: { type: 'date' },
      },
    },
  },
  orders: {
    name: 'orders',
    mappings: {
      properties: {
        id: { type: 'keyword' },
        orderNumber: { type: 'keyword' },
        userId: { type: 'keyword' },
        status: { type: 'keyword' },
        totalAmount: { type: 'float' },
        currency: { type: 'keyword' },
        items: { type: 'nested' },
        createdAt: { type: 'date' },
        deliveryDate: { type: 'date' },
      },
    },
  },
};

/**
 * Advanced Search Service
 */
export class SearchService {
  /**
   * Initialize indices
   */
  async initializeIndices(): Promise<void> {
    for (const [key, config] of Object.entries(INDICES)) {
      try {
        const exists = await elasticsearch.indices.exists({ index: config.name });
        
        if (!exists) {
          await elasticsearch.indices.create({
            index: config.name,
            body: {
              mappings: config.mappings,
              settings: config.settings || {},
            },
          });
          
          monitoring.info(`Created index: ${config.name}`);
        }
      } catch (error) {
        monitoring.error(`Failed to create index ${config.name}`, error as Error);
      }
    }
  }

  /**
   * Index a document
   */
  async index(index: string, id: string, document: any): Promise<void> {
    try {
      await elasticsearch.index({
        index,
        id,
        body: document,
        refresh: 'wait_for',
      });

      monitoring.debug(`Indexed document ${id} in ${index}`);
    } catch (error) {
      monitoring.error(`Failed to index document`, error as Error);
      throw error;
    }
  }

  /**
   * Bulk index documents
   */
  async bulkIndex(index: string, documents: Array<{ id: string; data: any }>): Promise<void> {
    try {
      const body = documents.flatMap(doc => [
        { index: { _index: index, _id: doc.id } },
        doc.data,
      ]);

      const result = await elasticsearch.bulk({
        body,
        refresh: 'wait_for',
      });

      if (result.errors) {
        const errors = result.items.filter(item => item.index?.error);
        monitoring.error('Bulk indexing errors', errors);
      }

      monitoring.info(`Bulk indexed ${documents.length} documents in ${index}`);
    } catch (error) {
      monitoring.error('Bulk indexing failed', error as Error);
      throw error;
    }
  }

  /**
   * Update a document
   */
  async update(index: string, id: string, updates: any): Promise<void> {
    try {
      await elasticsearch.update({
        index,
        id,
        body: {
          doc: updates,
        },
        refresh: 'wait_for',
      });

      monitoring.debug(`Updated document ${id} in ${index}`);
    } catch (error) {
      monitoring.error(`Failed to update document`, error as Error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async delete(index: string, id: string): Promise<void> {
    try {
      await elasticsearch.delete({
        index,
        id,
        refresh: 'wait_for',
      });

      monitoring.debug(`Deleted document ${id} from ${index}`);
    } catch (error) {
      monitoring.error(`Failed to delete document`, error as Error);
      throw error;
    }
  }

  /**
   * Advanced search
   */
  async search<T = any>(index: string, searchQuery: SearchQuery): Promise<SearchResult<T>> {
    const cacheKey = `search:${index}:${JSON.stringify(searchQuery)}`;
    
    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      monitoring.debug('Search cache hit', { index, query: searchQuery.query });
      return cached as SearchResult<T>;
    }

    try {
      const timer = monitoring.startTimer('elasticsearch_search');
      
      // Build Elasticsearch query
      const esQuery = this.buildElasticsearchQuery(searchQuery);

      // Execute search
      const response = await elasticsearch.search({
        index,
        body: esQuery,
      });

      const elapsed = timer();

      // Process results
      const result: SearchResult<T> = {
        hits: response.hits.hits.map(hit => ({
          id: hit._id as string,
          score: hit._score || 0,
          source: hit._source as T,
          highlight: hit.highlight as Record<string, string[]>,
        })),
        total: (response.hits.total as any).value || response.hits.total as number,
        took: elapsed,
        maxScore: response.hits.max_score || undefined,
      };

      // Process facets
      if (searchQuery.facets && response.aggregations) {
        result.facets = this.processFacets(response.aggregations);
      }

      // Process suggestions
      if (searchQuery.suggest && response.suggest) {
        result.suggestions = this.processSuggestions(response.suggest);
      }

      // Cache results
      await cache.set(cacheKey, result, { ttl: 60000 }); // 1 minute cache

      monitoring.info('Search completed', {
        index,
        query: searchQuery.query,
        hits: result.hits.length,
        total: result.total,
        took: elapsed,
      });

      return result;
    } catch (error) {
      monitoring.error('Search failed', error as Error);
      throw error;
    }
  }

  /**
   * Build Elasticsearch query
   */
  private buildElasticsearchQuery(searchQuery: SearchQuery): any {
    const esQuery: any = {
      size: searchQuery.pagination?.size || 20,
      from: ((searchQuery.pagination?.page || 1) - 1) * (searchQuery.pagination?.size || 20),
    };

    // Build query
    const must: any[] = [];
    const should: any[] = [];
    const filter: any[] = [];

    // Main search query
    if (searchQuery.query) {
      if (searchQuery.fuzzy) {
        must.push({
          multi_match: {
            query: searchQuery.query,
            fields: this.getSearchFields(searchQuery.boost),
            type: 'best_fields',
            fuzziness: 'AUTO',
            prefix_length: 2,
          },
        });
      } else {
        must.push({
          multi_match: {
            query: searchQuery.query,
            fields: this.getSearchFields(searchQuery.boost),
            type: 'best_fields',
          },
        });
      }
    }

    // Apply filters
    if (searchQuery.filters) {
      searchQuery.filters.forEach(f => {
        filter.push(this.buildFilter(f));
      });
    }

    // Combine query parts
    esQuery.query = {
      bool: {
        must: must.length > 0 ? must : undefined,
        should: should.length > 0 ? should : undefined,
        filter: filter.length > 0 ? filter : undefined,
      },
    };

    // Add sorting
    if (searchQuery.sort && searchQuery.sort.length > 0) {
      esQuery.sort = searchQuery.sort.map(s => ({
        [s.field]: { order: s.order },
      }));
    } else {
      esQuery.sort = ['_score', { _id: 'desc' }];
    }

    // Add highlighting
    if (searchQuery.highlight) {
      esQuery.highlight = {
        fields: {
          '*': {
            pre_tags: ['<mark>'],
            post_tags: ['</mark>'],
            fragment_size: 150,
            number_of_fragments: 3,
          },
        },
      };
    }

    // Add facets (aggregations)
    if (searchQuery.facets) {
      esQuery.aggs = {};
      searchQuery.facets.forEach(facet => {
        esQuery.aggs[facet] = {
          terms: {
            field: facet,
            size: 20,
          },
        };
      });
    }

    // Add suggestions
    if (searchQuery.suggest && searchQuery.query) {
      esQuery.suggest = {
        text: searchQuery.query,
        simple_phrase: {
          phrase: {
            field: 'suggest',
            size: 5,
            gram_size: 3,
            direct_generator: [{
              field: 'suggest',
              suggest_mode: 'always',
            }],
          },
        },
      };
    }

    return esQuery;
  }

  /**
   * Get search fields with boost
   */
  private getSearchFields(boost?: SearchBoost[]): string[] {
    const defaultFields = [
      'name^3',
      'nameAr^3',
      'description^2',
      'descriptionAr^2',
      'brand^1.5',
      'category',
      'tags',
    ];

    if (!boost || boost.length === 0) {
      return defaultFields;
    }

    return boost.map(b => `${b.field}^${b.weight}`);
  }

  /**
   * Build filter
   */
  private buildFilter(filter: SearchFilter): any {
    switch (filter.operator) {
      case 'eq':
        return { term: { [filter.field]: filter.value } };
      
      case 'ne':
        return { bool: { must_not: { term: { [filter.field]: filter.value } } } };
      
      case 'gt':
        return { range: { [filter.field]: { gt: filter.value } } };
      
      case 'gte':
        return { range: { [filter.field]: { gte: filter.value } } };
      
      case 'lt':
        return { range: { [filter.field]: { lt: filter.value } } };
      
      case 'lte':
        return { range: { [filter.field]: { lte: filter.value } } };
      
      case 'in':
        return { terms: { [filter.field]: filter.value } };
      
      case 'nin':
        return { bool: { must_not: { terms: { [filter.field]: filter.value } } } };
      
      case 'exists':
        return { exists: { field: filter.field } };
      
      case 'range':
        return { range: { [filter.field]: filter.value } };
      
      default:
        return { term: { [filter.field]: filter.value } };
    }
  }

  /**
   * Process facets
   */
  private processFacets(aggregations: any): Record<string, FacetBucket[]> {
    const facets: Record<string, FacetBucket[]> = {};

    for (const [key, agg] of Object.entries(aggregations)) {
      if ((agg as any).buckets) {
        facets[key] = (agg as any).buckets.map((bucket: any) => ({
          key: bucket.key,
          count: bucket.doc_count,
        }));
      }
    }

    return facets;
  }

  /**
   * Process suggestions
   */
  private processSuggestions(suggest: any): string[] {
    const suggestions: string[] = [];

    if (suggest.simple_phrase) {
      suggest.simple_phrase.forEach((suggestion: any) => {
        suggestion.options.forEach((option: any) => {
          suggestions.push(option.text);
        });
      });
    }

    return suggestions;
  }

  /**
   * Autocomplete search
   */
  async autocomplete(index: string, prefix: string, field: string = 'suggest'): Promise<string[]> {
    try {
      const response = await elasticsearch.search({
        index,
        body: {
          suggest: {
            autocomplete: {
              prefix,
              completion: {
                field,
                size: 10,
                skip_duplicates: true,
              },
            },
          },
        },
      });

      const suggestions: string[] = [];
      
      if (response.suggest?.autocomplete) {
        response.suggest.autocomplete[0].options.forEach((option: any) => {
          suggestions.push(option.text);
        });
      }

      return suggestions;
    } catch (error) {
      monitoring.error('Autocomplete failed', error as Error);
      return [];
    }
  }

  /**
   * More like this search
   */
  async moreLikeThis<T = any>(index: string, id: string, options?: {
    maxResults?: number;
    minTermFreq?: number;
    minDocFreq?: number;
  }): Promise<SearchResult<T>> {
    try {
      const response = await elasticsearch.search({
        index,
        body: {
          query: {
            more_like_this: {
              fields: ['name', 'description', 'category', 'tags'],
              like: [
                {
                  _index: index,
                  _id: id,
                },
              ],
              min_term_freq: options?.minTermFreq || 1,
              min_doc_freq: options?.minDocFreq || 1,
              max_query_terms: 20,
            },
          },
          size: options?.maxResults || 10,
        },
      });

      return {
        hits: response.hits.hits.map(hit => ({
          id: hit._id as string,
          score: hit._score || 0,
          source: hit._source as T,
        })),
        total: (response.hits.total as any).value || response.hits.total as number,
        took: response.took,
      };
    } catch (error) {
      monitoring.error('More like this search failed', error as Error);
      throw error;
    }
  }

  /**
   * Geo search
   */
  async geoSearch<T = any>(index: string, options: {
    location: { lat: number; lon: number };
    distance: string;
    field?: string;
  }): Promise<SearchResult<T>> {
    try {
      const response = await elasticsearch.search({
        index,
        body: {
          query: {
            bool: {
              filter: {
                geo_distance: {
                  distance: options.distance,
                  [options.field || 'location']: options.location,
                },
              },
            },
          },
          sort: [
            {
              _geo_distance: {
                [options.field || 'location']: options.location,
                order: 'asc',
                unit: 'km',
              },
            },
          ],
        },
      });

      return {
        hits: response.hits.hits.map(hit => ({
          id: hit._id as string,
          score: hit._score || 0,
          source: hit._source as T,
          distance: (hit.sort as number[])[0],
        })) as any,
        total: (response.hits.total as any).value || response.hits.total as number,
        took: response.took,
      };
    } catch (error) {
      monitoring.error('Geo search failed', error as Error);
      throw error;
    }
  }

  /**
   * Reindex data
   */
  async reindex(sourceIndex: string, targetIndex: string): Promise<void> {
    try {
      const response = await elasticsearch.reindex({
        body: {
          source: { index: sourceIndex },
          dest: { index: targetIndex },
        },
        wait_for_completion: true,
      });

      monitoring.info(`Reindexed from ${sourceIndex} to ${targetIndex}`, {
        took: response.took,
        total: response.total,
        created: response.created,
      });
    } catch (error) {
      monitoring.error('Reindex failed', error as Error);
      throw error;
    }
  }

  /**
   * Get index stats
   */
  async getIndexStats(index?: string): Promise<any> {
    try {
      const response = await elasticsearch.indices.stats({
        index: index || '_all',
      });

      return response;
    } catch (error) {
      monitoring.error('Failed to get index stats', error as Error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const health = await elasticsearch.cluster.health();
      return health.status !== 'red';
    } catch (error) {
      monitoring.error('Elasticsearch health check failed', error as Error);
      return false;
    }
  }
}

// Export singleton instance
export const searchService = new SearchService();

// Initialize indices on startup
searchService.initializeIndices().catch(error => {
  monitoring.error('Failed to initialize search indices', error);
});

export default searchService;
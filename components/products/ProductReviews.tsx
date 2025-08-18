'use client';

import { useState } from 'react';
import { Star, ThumbsUp, User, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  helpful: number;
  verified: boolean;
  images?: string[];
}

const mockReviews: Review[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'Dr. Ahmed Hassan',
    rating: 5,
    title: 'Excellent MRI Scanner',
    comment: 'We have been using this MRI scanner for 6 months now. The image quality is exceptional and the AI-powered diagnostics have significantly improved our workflow. Highly recommended for any medical facility.',
    date: '2024-01-10',
    helpful: 45,
    verified: true,
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'King Faisal Hospital',
    rating: 4,
    title: 'Great product with minor issues',
    comment: 'Overall a great MRI scanner. The image quality is superb and patient comfort features are excellent. Only issue is the initial setup took longer than expected. Support team was helpful though.',
    date: '2024-01-05',
    helpful: 32,
    verified: true,
  },
  {
    id: '3',
    userId: 'user3',
    userName: 'Dr. Fatima Al-Rashid',
    rating: 5,
    title: 'Worth the investment',
    comment: 'This scanner has transformed our diagnostic capabilities. The silent scan technology is a game-changer for pediatric patients. Installation team was professional and training was comprehensive.',
    date: '2023-12-28',
    helpful: 28,
    verified: true,
  },
];

const ratingDistribution = {
  5: 75,
  4: 15,
  3: 7,
  2: 2,
  1: 1,
};

export function ProductReviews({ productId }: { productId: string }) {
  const [sortBy, setSortBy] = useState('helpful');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userRating, setUserRating] = useState(0);

  const averageRating = 4.8;
  const totalReviews = 124;

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{averageRating}</div>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Based on {totalReviews} reviews
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="md:col-span-2 space-y-2">
              {Object.entries(ratingDistribution)
                .reverse()
                .map(([stars, percentage]) => (
                  <div key={stars} className="flex items-center space-x-3">
                    <span className="text-sm w-12">{stars} star</span>
                    <Progress value={percentage} className="flex-1" />
                    <span className="text-sm text-muted-foreground w-12">
                      {percentage}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="helpful">Most Helpful</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="rating-high">Highest Rating</SelectItem>
              <SelectItem value="rating-low">Lowest Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowReviewForm(!showReviewForm)}>
          Write a Review
        </Button>
      </div>

      {/* Write Review Form */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Write Your Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rating</label>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setUserRating(i + 1)}
                    className="p-1"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        i < userRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Review Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Summarize your experience"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Your Review</label>
              <Textarea
                placeholder="Share your experience with this product"
                rows={4}
              />
            </div>
            <div className="flex space-x-3">
              <Button>Submit Review</Button>
              <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {mockReviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{review.userName}</span>
                      {review.verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              <h4 className="font-semibold mb-2">{review.title}</h4>
              <p className="text-muted-foreground mb-4">{review.comment}</p>

              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Helpful ({review.helpful})
                </Button>
                <Button variant="ghost" size="sm">
                  Report
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline">Load More Reviews</Button>
      </div>
    </div>
  );
}
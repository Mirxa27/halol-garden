import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground",
  {
    variants: {
      variant: {
        default: "shadow-sm",
        elevated: "shadow-lg hover:shadow-xl transition-shadow",
        outline: "border-2",
        ghost: "border-0 shadow-none",
        gradient: "bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  hoverable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hoverable, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant }),
        hoverable && "transition-transform hover:scale-[1.02] cursor-pointer",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Additional card components for specific use cases

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, description, icon, trend, ...props }, ref) => (
    <Card ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className={cn(
            "flex items-center text-xs mt-2",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            <span className="mr-1">{trend.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </CardContent>
      {icon && (
        <div className="absolute -right-4 -bottom-4 opacity-10">
          <div className="w-32 h-32">{icon}</div>
        </div>
      )}
    </Card>
  )
);
StatCard.displayName = "StatCard";

interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  image: string;
  title: string;
  price: number;
  currency?: string;
  rating?: number;
  reviews?: number;
  badge?: string;
  onAddToCart?: () => void;
  onViewDetails?: () => void;
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({ 
    className, 
    image, 
    title, 
    price, 
    currency = "USD",
    rating,
    reviews,
    badge,
    onAddToCart,
    onViewDetails,
    ...props 
  }, ref) => (
    <Card 
      ref={ref} 
      className={cn("overflow-hidden group", className)} 
      hoverable 
      {...props}
    >
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        {badge && (
          <span className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 text-xs rounded-md">
            {badge}
          </span>
        )}
      </div>
      <CardHeader>
        <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
        {rating && (
          <div className="flex items-center gap-1 mt-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.floor(rating) ? "text-yellow-500" : "text-gray-300"}>
                  ★
                </span>
              ))}
            </div>
            {reviews && (
              <span className="text-sm text-muted-foreground">({reviews})</span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
          }).format(price)}
        </p>
      </CardContent>
      {(onAddToCart || onViewDetails) && (
        <CardFooter className="gap-2">
          {onAddToCart && (
            <button 
              onClick={onAddToCart}
              className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Add to Cart
            </button>
          )}
          {onViewDetails && (
            <button 
              onClick={onViewDetails}
              className="flex-1 border border-input px-4 py-2 rounded-md hover:bg-accent transition-colors"
            >
              View Details
            </button>
          )}
        </CardFooter>
      )}
    </Card>
  )
);
ProductCard.displayName = "ProductCard";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  ProductCard,
  cardVariants,
};

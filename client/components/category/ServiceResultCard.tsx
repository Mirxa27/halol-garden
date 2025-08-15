import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Eye, Heart, CheckCircle, Wrench, Zap } from "lucide-react";
import { ServiceItem } from "@/types/category";

interface ServiceResultCardProps {
  item: ServiceItem;
  viewMode: 'grid' | 'list';
}

export function ServiceResultCard({ item, viewMode }: ServiceResultCardProps) {
  return (
    <Card className={`glass-card border-0 hover:shadow-xl transition-all duration-300 ${viewMode === 'grid' ? 'h-fit' : ''}`}>
      <CardContent className={viewMode === 'list' ? 'p-6' : 'p-4'}>
        <div className={`flex ${viewMode === 'list' ? 'gap-6' : 'flex-col'}`}>
          <div className={`${viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'w-full h-48 mb-4'} rounded-xl overflow-hidden bg-white`}>
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Wrench className="h-4 w-4" />
                    <span className="mr-1">خدمة</span>
                  </Badge>
                  {item.verified && <Badge className="bg-success text-success-foreground text-xs"><CheckCircle className="h-3 w-3 ml-1" />موثق</Badge>}
                  {item.emergency && <Badge className="bg-destructive text-destructive-foreground text-xs"><Zap className="h-3 w-3 ml-1" />طوارئ</Badge>}
                </div>
                <h3 className="font-bold text-primary text-lg mb-1 text-arabic line-clamp-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{item.titleEn}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="text-arabic">{item.provider}</span>
                  <div className="flex items-center gap-1"><Star className="h-3 w-3 fill-current text-success" /><span>{item.rating}</span><span>({item.reviews})</span></div>
                  <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /><span>{item.location}</span></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold text-primary">{item.price}</span>
                  <span className="text-sm text-muted-foreground">ريال</span>
                </div>
                <div className="text-xs text-muted-foreground text-arabic">المدة: {item.duration}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="glass-hover border-primary/30"><Heart className="h-3 w-3" /></Button>
                <Link to={`/services/${item.id}`}><Button size="sm" className="bg-primary hover:bg-primary/90 text-arabic"><Eye className="ml-2 h-3 w-3" />{viewMode === 'list' ? 'عرض التفاصيل' : 'عرض'}</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { VIPAllocationTab } from '@/components/VIPAllocationTab';
import { ParticipantAllocationTab } from '@/components/ParticipantAllocationTab';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar, Users, Lightbulb, CheckCircle, Crown, Home } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';

const GroupAllocation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { groups, updateGroup } = useAdminGroups();
  const [refreshKey, setRefreshKey] = useState(0);

  const group = groups.find(g => g.id === id);

  // Force re-render when group data changes
  const handleUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-4">קבוצה לא נמצאה</p>
          <Button onClick={() => navigate('/')}>חזור לדשבורד</Button>
        </div>
      </div>
    );
  }

  const staffCount = group.staffCount || 0;
  const participantCount = group.participantCount || (group.pax - staffCount);
  const remainingStaff = group.remainingStaff ?? staffCount;
  const remainingParticipants = group.remainingParticipants ?? participantCount;
  
  const recommendedVIPTents = Math.ceil(remainingStaff / 3);
  const isComplete = remainingStaff === 0 && remainingParticipants === 0;

  const handleMarkComplete = () => {
    updateGroup(group.id, { assignmentStatus: 'fully_allocated' });
    toast.success('השיבוץ הושלם בהצלחה!');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b-2 border-border sticky top-0 z-10">
        <div className="container py-3 md:py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
              className="shrink-0"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold truncate">{group.groupName}</h1>
              <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  {format(parseISO(group.startDate), 'd MMM', { locale: he })} - {format(parseISO(group.endDate), 'd MMM', { locale: he })}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  {group.pax}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-4 md:py-6">
        {/* Summary Counters */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
          <Card className={remainingStaff === 0 ? 'border-green-400' : ''}>
            <CardContent className="p-4 md:p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-0.5 md:mb-1">
                {remainingStaff}
              </div>
              <div className="text-sm md:text-base text-muted-foreground">צוות</div>
              <div className="text-xs md:text-sm text-muted-foreground">
                מתוך {staffCount}
              </div>
            </CardContent>
          </Card>
          
          <Card className={remainingParticipants === 0 ? 'border-green-400' : ''}>
            <CardContent className="p-4 md:p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-0.5 md:mb-1">
                {remainingParticipants}
              </div>
              <div className="text-sm md:text-base text-muted-foreground">חניכים</div>
              <div className="text-xs md:text-sm text-muted-foreground">
                מתוך {participantCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        {!isComplete && (
          <div className="bg-muted/50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-sm">
              <span className="font-medium">המלצה:</span>
              {' '}
              {remainingStaff > 0 && `אוהלי VIP מומלצים: ${recommendedVIPTents}`}
              {remainingStaff > 0 && remainingParticipants > 0 && ' | '}
              {remainingParticipants > 0 && `שכונות דרושות: ~${Math.ceil(remainingParticipants / 64)}`}
            </div>
          </div>
        )}

        {/* Completion Banner */}
        {isComplete && (
          <Card className="mb-6 border-green-400 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
                      שיבוץ הושלם!
                    </h3>
                    <p className="text-green-600 dark:text-green-400">
                      כל הצוות והחניכים שובצו בהצלחה
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleMarkComplete}
                  className="bg-green-600 hover:bg-green-700"
                >
                  סמן כהושלם וחזור לדשבורד
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Allocation Tabs */}
        <Tabs defaultValue="vip" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6 h-auto">
            <TabsTrigger value="vip" className="flex items-center gap-1.5 md:gap-2 py-3 md:py-2 text-sm md:text-base">
              <Crown className="w-4 h-4 shrink-0" />
              <span className="truncate">VIP צוות</span>
              {remainingStaff > 0 && (
                <Badge variant="secondary" className="mr-0.5 md:mr-1 text-xs">{remainingStaff}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex items-center gap-1.5 md:gap-2 py-3 md:py-2 text-sm md:text-base">
              <Home className="w-4 h-4 shrink-0" />
              <span className="truncate">חניכים</span>
              {remainingParticipants > 0 && (
                <Badge variant="secondary" className="mr-0.5 md:mr-1 text-xs">{remainingParticipants}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="vip">
            <VIPAllocationTab 
              key={`vip-${refreshKey}`}
              group={group} 
              onUpdate={handleUpdate} 
            />
          </TabsContent>
          
          <TabsContent value="participants">
            <ParticipantAllocationTab 
              key={`participants-${refreshKey}`}
              group={group} 
              onUpdate={handleUpdate} 
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default GroupAllocation;

import React, { useState, useEffect } from 'react';
import { api, endpoints } from '../../services/axios.config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  Calendar,
  TrendingUp,
  Clock,
  Video,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw
} from "lucide-react";

const StudentDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get(endpoints.dashboard.student);
      setDashboardData(response.data);
      setError('');
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Erreur lors du chargement du dashboard'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSubscriptionStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'expired':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Expiré</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      default:
        return <Badge variant="outline">Non défini</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={fetchDashboardData}
              className="w-full mt-4"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Étudiant
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenue, {dashboardData?.user?.name || 'Étudiant'}
          </p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Subscription Status */}
      {dashboardData?.subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Statut d'abonnement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  {getSubscriptionStatusBadge(dashboardData.subscription.status)}
                  <span className="text-sm text-gray-600">
                    {dashboardData.subscription.teacher_name}
                  </span>
                </div>
                {dashboardData.subscription.expires_at && (
                  <p className="text-sm text-gray-500 mt-1">
                    Expire le {formatDate(dashboardData.subscription.expires_at)}
                  </p>
                )}
              </div>
              {dashboardData.subscription.status === 'active' && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {dashboardData.subscription.days_remaining || 0}
                  </div>
                  <div className="text-xs text-gray-500">jours restants</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <div className="text-2xl font-bold">
                  {dashboardData?.stats?.chapters_available || 0}
                </div>
                <div className="text-xs text-gray-500">Chapitres disponibles</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Video className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <div className="text-2xl font-bold">
                  {dashboardData?.stats?.videos_watched || 0}
                </div>
                <div className="text-xs text-gray-500">Vidéos regardées</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <div className="text-2xl font-bold">
                  {dashboardData?.stats?.sessions_attended || 0}
                </div>
                <div className="text-xs text-gray-500">Sessions suivies</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-orange-500" />
              <div className="ml-4">
                <div className="text-2xl font-bold">
                  {dashboardData?.stats?.progress_percentage || 0}%
                </div>
                <div className="text-xs text-gray-500">Progression</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {dashboardData?.recent_activity && dashboardData.recent_activity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Vos dernières actions sur la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recent_activity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    {activity.created_at && (
                      <p className="text-xs text-gray-500">
                        {formatDate(activity.created_at)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Sessions */}
      {dashboardData?.upcoming_sessions && dashboardData.upcoming_sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sessions à venir</CardTitle>
            <CardDescription>Vos prochaines sessions de cours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.upcoming_sessions.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{session.teacher_name}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(session.session_date)} à {session.start_time}
                    </p>
                  </div>
                  <Badge variant="outline">
                    <Calendar className="w-3 h-3 mr-1" />
                    {session.status || 'Planifié'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No subscription message */}
      {!dashboardData?.subscription && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-orange-800 mb-2">
                Aucun abonnement actif
              </h3>
              <p className="text-orange-700 mb-4">
                Souscrivez à un abonnement pour accéder à tous les cours et fonctionnalités.
              </p>
              <Button className="bg-orange-600 hover:bg-orange-700">
                Découvrir les abonnements
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentDashboardPage;
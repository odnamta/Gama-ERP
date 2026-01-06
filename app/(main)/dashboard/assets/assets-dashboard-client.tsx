'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Truck, 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  TrendingUp,
  Calendar,
  MapPin,
  Settings
} from 'lucide-react'
import { UserRole } from '@/types/permissions'

interface AssetsDashboardClientProps {
  userRole: UserRole
}

interface AssetSummary {
  total: number
  active: number
  maintenance: number
  idle: number
  disposed: number
}

interface MaintenanceAlert {
  id: string
  asset_name: string
  asset_number: string
  maintenance_type: string
  due_date: string
  overdue_days?: number
}

interface UtilizationData {
  asset_id: string
  asset_name: string
  asset_number: string
  utilization_rate: number
  revenue_generated: number
  hours_worked: number
}

export function AssetsDashboardClient({ userRole }: AssetsDashboardClientProps) {
  const router = useRouter()
  const [assetSummary, setAssetSummary] = useState<AssetSummary>({
    total: 0,
    active: 0,
    maintenance: 0,
    idle: 0,
    disposed: 0
  })
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([])
  const [topPerformers, setTopPerformers] = useState<UtilizationData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API calls
      // Mock data for now
      setAssetSummary({
        total: 45,
        active: 32,
        maintenance: 8,
        idle: 4,
        disposed: 1
      })

      setMaintenanceAlerts([
        {
          id: '1',
          asset_name: 'Crane Liebherr LTM 1200',
          asset_number: 'CR-001',
          maintenance_type: 'Annual Inspection',
          due_date: '2026-01-15',
          overdue_days: 0
        },
        {
          id: '2',
          asset_name: 'Trailer Goldhofer THP/SL',
          asset_number: 'TR-005',
          maintenance_type: 'Hydraulic Service',
          due_date: '2026-01-10',
          overdue_days: 3
        }
      ])

      setTopPerformers([
        {
          asset_id: '1',
          asset_name: 'Crane Liebherr LTM 1200',
          asset_number: 'CR-001',
          utilization_rate: 85,
          revenue_generated: 450000000,
          hours_worked: 180
        },
        {
          asset_id: '2',
          asset_name: 'Prime Mover Volvo FH16',
          asset_number: 'PM-003',
          utilization_rate: 78,
          revenue_generated: 320000000,
          hours_worked: 165
        }
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'idle': return 'bg-gray-100 text-gray-800'
      case 'disposed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor asset performance, maintenance, and utilization
          </p>
        </div>
        <Button onClick={() => router.push('/equipment')}>
          <Settings className="h-4 w-4 mr-2" />
          Manage Equipment
        </Button>
      </div>

      {/* Asset Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assetSummary.total}</div>
            <p className="text-xs text-muted-foreground">
              All registered assets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{assetSummary.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{assetSummary.maintenance}</div>
            <p className="text-xs text-muted-foreground">
              Under maintenance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Idle</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{assetSummary.idle}</div>
            <p className="text-xs text-muted-foreground">
              Not in use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disposed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{assetSummary.disposed}</div>
            <p className="text-xs text-muted-foreground">
              End of life
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="maintenance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="maintenance">Maintenance Alerts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Maintenance Alerts
              </CardTitle>
              <CardDescription>
                Assets requiring attention or overdue maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{alert.asset_name}</h4>
                        <Badge variant="outline">{alert.asset_number}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.maintenance_type}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        Due: {new Date(alert.due_date).toLocaleDateString('id-ID')}
                        {alert.overdue_days && alert.overdue_days > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {alert.overdue_days} days overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button size="sm">
                      Schedule
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Top Performing Assets
              </CardTitle>
              <CardDescription>
                Assets with highest utilization and revenue generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((asset) => (
                  <div key={asset.asset_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{asset.asset_name}</h4>
                        <Badge variant="outline">{asset.asset_number}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Utilization: {asset.utilization_rate}%</span>
                        <span>Hours: {asset.hours_worked}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        {formatCurrency(asset.revenue_generated)}
                      </div>
                      <div className="text-sm text-muted-foreground">Revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Asset Utilization
              </CardTitle>
              <CardDescription>
                Current location and utilization status of assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Asset tracking and utilization charts will be displayed here</p>
                <p className="text-sm">Integration with GPS tracking and job assignments</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
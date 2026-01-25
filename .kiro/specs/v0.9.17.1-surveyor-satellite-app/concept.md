# Surveyor Satellite App - Concept Document

## Overview

A lightweight mobile/PWA satellite application for field surveyors to capture route data, flag obstacles with GPS coordinates and photos, and auto-sync to the main GAMA ERP. This keeps the main ERP lean while providing advanced field tools.

## Problem Statement

1. **ERP Bloat** - Adding GPS tracking, camera integration, and real-time uploads to the main ERP would increase bundle size and complexity
2. **Field Conditions** - Surveyors work in remote areas with poor/no connectivity
3. **Mobile UX** - Touch-based obstacle flagging and camera capture need mobile-native experience
4. **Different User Context** - Field surveyors need a focused, simple UI vs full ERP

## Proposed Solution

A standalone satellite app that:
- Runs on mobile devices (PWA or React Native)
- Works offline-first with background sync
- Captures GPS tracks, obstacle flags, and photos
- Auto-uploads to Supabase when connected
- Integrates seamlessly with existing ERP tables

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  SURVEYOR SATELLITE APP (Mobile/PWA)                            │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ GPS Track   │ →  │ Flag        │ →  │ Local       │         │
│  │ Recording   │    │ Obstacles   │    │ Storage     │         │
│  │             │    │ + Photos    │    │ (IndexedDB) │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                              ↓                  │
│                                        ┌─────────────┐         │
│                                        │ Background  │         │
│                                        │ Sync Engine │         │
│                                        └─────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              ↓ 
                    Supabase (shared backend)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  GAMA ERP (Main App)                                            │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Survey      │ →  │ JMP         │ →  │ Engineering │         │
│  │ Report      │    │ Generation  │    │ Drawings    │         │
│  │ (view/edit) │    │             │    │ & Calcs     │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack Options

### Option A: Progressive Web App (PWA)
- **Pros**: Single codebase, easy deployment, no app store approval
- **Cons**: Limited native features, iOS PWA limitations
- **Stack**: Next.js/React + Workbox + IndexedDB

### Option B: React Native / Expo
- **Pros**: Full native access (GPS, camera), better offline support
- **Cons**: Separate codebase, app store deployment
- **Stack**: Expo + React Native + AsyncStorage/SQLite

### Option C: Capacitor (Hybrid)
- **Pros**: Web codebase with native plugins, single codebase
- **Cons**: Performance trade-offs
- **Stack**: React + Capacitor + SQLite

**Recommendation**: Start with PWA for quick iteration, migrate to React Native if native features become limiting.

## Core Features

### 1. Route Recording
- Start/stop GPS tracking
- Record waypoints at intervals (configurable: 10m, 50m, 100m)
- Display live map with route trace
- Calculate total distance and estimated time

### 2. Obstacle Flagging
- Tap map or button to flag current location
- Obstacle types:
  - Bridge (with clearance height/width/weight limit)
  - Overhead cable/wire
  - Narrow road section
  - Sharp turn
  - Steep gradient
  - Road surface issue
  - Traffic restriction
  - Other (custom note)
- Attach photos (up to 5 per obstacle)
- Add notes/description
- Record GPS coordinates automatically

### 3. Photo Capture
- Camera integration with GPS tagging
- Auto-compress for upload (configurable quality)
- Store locally until sync
- Support for multiple photos per obstacle

### 4. Offline-First Storage
- Store all data locally (IndexedDB/SQLite)
- Queue uploads for when online
- Show sync status indicator
- Handle conflict resolution

### 5. Background Sync
- Auto-sync when connectivity restored
- Upload photos to Supabase Storage
- Update database records
- Show progress indicator
- Retry failed uploads

## Data Model

### Local Storage Schema

```typescript
interface LocalSurvey {
  id: string // UUID, generated locally
  surveyNumber: string // Generated: SRV-YYYYMMDD-XXXX
  status: 'recording' | 'paused' | 'completed' | 'synced'
  startedAt: string
  completedAt?: string
  syncedAt?: string
  
  // Route info
  originLocation: string
  destinationLocation: string
  
  // Cargo info (optional, can fill later)
  cargoDescription?: string
  cargoLengthM?: number
  cargoWidthM?: number
  cargoHeightM?: number
  cargoWeightTons?: number
}

interface LocalWaypoint {
  id: string
  surveyId: string
  sequence: number
  latitude: number
  longitude: number
  altitude?: number
  accuracy: number
  timestamp: string
  isObstacle: boolean
}

interface LocalObstacle {
  id: string
  surveyId: string
  waypointId: string
  obstacleType: ObstacleType
  severity: 'low' | 'medium' | 'high' | 'critical'
  
  // Measurements (type-specific)
  clearanceHeightM?: number
  clearanceWidthM?: number
  weightLimitTons?: number
  gradientPercent?: number
  turnRadiusM?: number
  
  description?: string
  photos: LocalPhoto[]
  createdAt: string
}

interface LocalPhoto {
  id: string
  obstacleId: string
  localUri: string // Local file path
  remoteUrl?: string // Supabase Storage URL after sync
  latitude: number
  longitude: number
  capturedAt: string
  syncStatus: 'pending' | 'uploading' | 'synced' | 'failed'
}

type ObstacleType = 
  | 'bridge'
  | 'overhead_cable'
  | 'narrow_road'
  | 'sharp_turn'
  | 'steep_gradient'
  | 'road_surface'
  | 'traffic_restriction'
  | 'other'
```

## Integration with GAMA ERP

### Existing Tables Used

1. **route_surveys** - Main survey record
   - Satellite app creates draft records
   - ERP completes with cost estimates, feasibility assessment

2. **route_waypoints** (new or extend existing)
   - GPS coordinates from satellite app
   - Obstacle flags with metadata

3. **Supabase Storage**
   - Bucket: `survey-photos`
   - Path: `surveys/{survey_id}/obstacles/{obstacle_id}/{photo_id}.jpg`

### Sync Strategy

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Satellite App   │     │    Supabase      │     │    GAMA ERP      │
│                  │     │                  │     │                  │
│  1. Record       │     │                  │     │                  │
│     survey       │     │                  │     │                  │
│     locally      │     │                  │     │                  │
│                  │     │                  │     │                  │
│  2. Complete     │────▶│  3. Insert       │     │                  │
│     survey       │     │     route_survey │     │                  │
│                  │     │     (status:     │     │                  │
│                  │     │      draft)      │     │                  │
│                  │     │                  │     │                  │
│  4. Upload       │────▶│  5. Store in     │     │                  │
│     photos       │     │     Storage      │     │                  │
│                  │     │                  │     │                  │
│  6. Sync         │────▶│  7. Insert       │     │                  │
│     waypoints    │     │     waypoints    │     │                  │
│     & obstacles  │     │     & obstacles  │     │                  │
│                  │     │                  │     │                  │
│                  │     │  8. Realtime     │────▶│  9. Survey       │
│                  │     │     subscription │     │     appears in   │
│                  │     │                  │     │     dashboard    │
│                  │     │                  │     │                  │
│                  │     │                  │     │  10. Engineer    │
│                  │     │                  │     │      reviews &   │
│                  │     │                  │     │      completes   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Database Changes Required

```sql
-- New table for waypoints (if not exists)
CREATE TABLE route_waypoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES route_surveys(id),
  sequence INTEGER NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  altitude DECIMAL(8, 2),
  accuracy DECIMAL(6, 2),
  is_obstacle BOOLEAN DEFAULT false,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- New table for obstacles
CREATE TABLE route_obstacles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES route_surveys(id),
  waypoint_id UUID REFERENCES route_waypoints(id),
  obstacle_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  clearance_height_m DECIMAL(5, 2),
  clearance_width_m DECIMAL(5, 2),
  weight_limit_tons DECIMAL(8, 2),
  gradient_percent DECIMAL(5, 2),
  turn_radius_m DECIMAL(6, 2),
  description TEXT,
  photos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX idx_waypoints_survey ON route_waypoints(survey_id);
CREATE INDEX idx_obstacles_survey ON route_obstacles(survey_id);
```

## User Flow

### Surveyor (Satellite App)

1. **Login** - Authenticate with same Supabase credentials
2. **Start Survey** - Enter origin/destination, start GPS recording
3. **Record Route** - Drive/walk the route, app records waypoints
4. **Flag Obstacles** - Tap to flag, select type, take photos, add notes
5. **Complete Survey** - Stop recording, review data
6. **Sync** - Auto-upload when online (or manual trigger)

### Engineer (GAMA ERP)

1. **View Dashboard** - See new surveys from satellite app
2. **Review Survey** - View route on map, obstacle details, photos
3. **Complete Assessment** - Add feasibility, cost estimates, recommendations
4. **Generate JMP** - Create Journey Management Plan from survey data
5. **Engineering Calcs** - Add drawings, calculations, permit requirements

## Security Considerations

1. **Authentication** - Same Supabase Auth as main ERP
2. **RLS Policies** - Surveyors can only see/edit their own surveys
3. **Photo Storage** - Private bucket with signed URLs
4. **Data Encryption** - HTTPS for all transfers, encrypted local storage

## MVP Scope

### Phase 1: Core Recording (MVP)
- [ ] PWA with offline support
- [ ] GPS route recording
- [ ] Basic obstacle flagging (type + notes)
- [ ] Photo capture with GPS
- [ ] Sync to Supabase
- [ ] View in ERP dashboard

### Phase 2: Enhanced Features
- [ ] Detailed obstacle measurements
- [ ] Map visualization in app
- [ ] Route playback
- [ ] Export to GPX/KML
- [ ] Push notifications for sync status

### Phase 3: Advanced
- [ ] Voice notes
- [ ] Video capture
- [ ] AR obstacle measurement
- [ ] Offline maps
- [ ] Team collaboration (multiple surveyors)

## Timeline Estimate

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1 MVP | 4-6 weeks | Basic PWA with core features |
| Phase 2 | 3-4 weeks | Enhanced features |
| Phase 3 | 4-6 weeks | Advanced features |

## Open Questions

1. **PWA vs Native** - Start with PWA, but need to validate GPS accuracy and camera quality on target devices
2. **Offline Maps** - Do surveyors need offline map tiles? (adds complexity)
3. **Multi-surveyor** - Can multiple surveyors work on same route?
4. **Integration Depth** - How much survey completion should happen in satellite vs ERP?

## Next Steps

1. Validate concept with Arka (primary user)
2. Decide on tech stack (PWA vs Native)
3. Design UI/UX mockups
4. Create detailed technical spec
5. Set up separate repository for satellite app

---

*Document Type: Concept/Planning*
*Status: Draft*
*Created: January 24, 2026*

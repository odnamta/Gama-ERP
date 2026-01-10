import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * DEBUG ENDPOINT: Test user_onboarding_status table access
 * Visit: /api/debug/test-onboarding
 */
export async function GET() {
  const supabase = await createClient()

  const results: any = {
    timestamp: new Date().toISOString(),
    tests: []
  }

  // Test 1: Check if we can query the table
  try {
    const { data, error } = await supabase
      .from('user_onboarding_status')
      .select('*')
      .limit(1)

    results.tests.push({
      name: 'SELECT from user_onboarding_status',
      success: !error,
      error: error?.message,
      errorCode: error?.code,
      errorDetails: error?.details,
      rowCount: data?.length || 0
    })
  } catch (e: any) {
    results.tests.push({
      name: 'SELECT from user_onboarding_status',
      success: false,
      error: e.message,
      exception: true
    })
  }

  // Test 2: Check if we can read current user
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    results.tests.push({
      name: 'Get authenticated user',
      success: !error,
      error: error?.message,
      userExists: !!user,
      userId: user?.id,
      userEmail: user?.email
    })

    // Test 3: If user exists, try to insert onboarding status
    if (user) {
      // First check if exists
      const { data: existing } = await supabase
        .from('user_onboarding_status')
        .select('id')
        .eq('user_id', user.id)
        .single()

      results.tests.push({
        name: 'Check existing onboarding status',
        existingRecord: existing ? 'YES' : 'NO',
        existingId: existing?.id
      })

      // If doesn't exist, try to create
      if (!existing) {
        const { data: inserted, error: insertError } = await supabase
          .from('user_onboarding_status')
          .insert({ user_id: user.id })
          .select()
          .single()

        results.tests.push({
          name: 'INSERT into user_onboarding_status',
          success: !insertError,
          error: insertError?.message,
          errorCode: insertError?.code,
          errorDetails: insertError?.details,
          insertedId: inserted?.id
        })
      }
    }
  } catch (e: any) {
    results.tests.push({
      name: 'User and insert tests',
      success: false,
      error: e.message,
      exception: true
    })
  }

  return NextResponse.json(results, { status: 200 })
}

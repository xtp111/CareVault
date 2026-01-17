'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function TestConnection() {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing')
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState<string[]>([])

  const testConnection = async () => {
    setStatus('testing')
    setMessage('Testing connection...')
    setDetails([])
    
    try {
      const newDetails: string[] = []
      
      // Test 1: Check environment variables
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!url || !key) {
        setStatus('error')
        setMessage('Environment variables not found')
        setDetails(['❌ Please check your .env.local file'])
        return
      }
      
      newDetails.push('✅ Environment variables loaded')
      newDetails.push(`✅ URL: ${url}`)
      
      // Test 2: Try to connect to documents table
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select('*')
        .limit(1)
      
      if (docError) {
        setStatus('error')
        setMessage('Failed to connect to Supabase')
        setDetails([...newDetails, `❌ Documents table error: ${docError.message}`])
        return
      }
      
      newDetails.push('✅ Documents table accessible')
      newDetails.push(`✅ Found ${docData?.length || 0} sample records`)
      
      // Test 3: Try to connect to medical_records table
      const { data: medData, error: medError } = await supabase
        .from('medical_records')
        .select('*')
        .limit(1)
      
      if (medError) {
        newDetails.push(`⚠️ Medical records table: ${medError.message}`)
      } else {
        newDetails.push('✅ Medical records table accessible')
        newDetails.push(`✅ Found ${medData?.length || 0} sample records`)
      }
      
      setStatus('success')
      setMessage('Successfully connected to Supabase!')
      setDetails(newDetails)
      
    } catch (err) {
      setStatus('error')
      setMessage('Unexpected error occurred')
      setDetails([`❌ ${err instanceof Error ? err.message : 'Unknown error'}`])
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Supabase Connection Test</h1>
          <p className="text-muted-foreground">Testing connection to CareVault database</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {status === 'testing' && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
              {status === 'success' && <CheckCircle2 className="w-6 h-6 text-green-500" />}
              {status === 'error' && <XCircle className="w-6 h-6 text-red-500" />}
              <div>
                <CardTitle>{message}</CardTitle>
                <CardDescription>
                  {status === 'testing' && 'Please wait...'}
                  {status === 'success' && 'All systems operational'}
                  {status === 'error' && 'Please check the details below'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {details.map((detail, index) => (
                <div key={index} className="text-sm font-mono p-2 bg-muted rounded">
                  {detail}
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex gap-3">
              <Button onClick={testConnection} disabled={status === 'testing'}>
                Test Again
              </Button>
              <Button variant="outline" asChild>
                <a href="/">Go to App</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>If you see errors:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Check that you created the tables in Supabase SQL Editor</li>
                <li>Verify your .env.local file has the correct credentials</li>
                <li>Make sure you ran the schema from supabase-schema.sql</li>
                <li>Restart your dev server after changing .env.local</li>
              </ul>
            </div>
            
            <div>
              <strong>Environment Variables:</strong>
              <div className="mt-2 space-y-1 text-muted-foreground">
                <div>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
                <div>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

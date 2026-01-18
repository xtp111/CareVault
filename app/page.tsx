'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Heart, Pill, User, Users, AlertCircle, FileCheck, Calendar, X, Trash2, Upload, Download, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatFileSize } from '@/lib/utils'

type DocumentCategory = 'legal' | 'medical' | 'financial' | 'identification'
type MedicalRecordType = 'doctors' | 'medications' | 'conditions'
type RepeatInterval = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

interface CareRecipient {
  id: string
  name: string
  date_of_birth?: string
  relationship?: string
  photo_url?: string
  notes?: string
  is_active: boolean
  created_at?: string
}

interface Document {
  id: string
  name: string
  category: DocumentCategory
  care_recipient_id: string
  file_url?: string
  file_name?: string
  file_size?: number
  date: string
}

interface MedicalRecord {
  id: string
  type: MedicalRecordType
  name: string
  details: string
  care_recipient_id: string
  date: string
}

interface Appointment {
  id: string;
  title: string;
  description: string;
  appointment_date: string; // ISO date string
  remind_before_minutes: number;
  repeat_interval: RepeatInterval;
  is_completed: boolean;
  care_recipient_id: string;
  created_at?: string;
}

export default function Home() {
  const [careRecipients, setCareRecipients] = useState<CareRecipient[]>([])
  const [selectedRecipient, setSelectedRecipient] = useState<CareRecipient | null>(null)
  const [showRecipientForm, setShowRecipientForm] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [showEmergencySummary, setShowEmergencySummary] = useState(false)
  const [showDocumentForm, setShowDocumentForm] = useState(false)
  const [showMedicalForm, setShowMedicalForm] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [documentForm, setDocumentForm] = useState({
    name: '',
    category: 'medical' as DocumentCategory,
    date: new Date().toISOString().split('T')[0]
  })
  
  const [medicalForm, setMedicalForm] = useState({
    type: 'medications' as MedicalRecordType,
    name: '',
    details: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [showAppointmentList, setShowAppointmentList] = useState(false)
  
  const [appointmentForm, setAppointmentForm] = useState({
    title: '',
    description: '',
    appointment_date: new Date(new Date().setHours(new Date().getHours() + 1)).toISOString().slice(0, 16), // Next hour as default
    remind_before_minutes: 30,
    repeat_interval: 'none' as RepeatInterval
  })
  
  const [recipientForm, setRecipientForm] = useState({
    name: '',
    date_of_birth: '',
    relationship: '',
    notes: ''
  })
  
  // Filter upcoming appointments
  const upcomingAppointments = appointments.filter(appt => {
    const now = new Date();
    const appointmentTime = new Date(appt.appointment_date);
    return !appt.is_completed && appointmentTime >= now;
  }).sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
  
  // Filter past appointments
  const pastAppointments = appointments.filter(appt => {
    const now = new Date();
    const appointmentTime = new Date(appt.appointment_date);
    return appt.is_completed || appointmentTime < now;
  }).sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());
  
  useEffect(() => {
    fetchData()
  }, [selectedRecipient])
  
  const fetchData = async () => {
    try {
      // Fetch care recipients first
      const { data: recipientsData, error: recipientsError } = await supabase
        .from('care_recipients')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
      
      if (recipientsData && !recipientsError) {
        setCareRecipients(recipientsData)
        if (recipientsData.length > 0 && !selectedRecipient) {
          setSelectedRecipient(recipientsData[0])
        }
      }
      
      // Only fetch data if a recipient is selected
      if (!selectedRecipient) return
      
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('care_recipient_id', selectedRecipient.id)
        .order('date', { ascending: false })
      
      if (documentsData && !documentsError) {
        setDocuments(documentsData)
      }
      
      const { data: medicalData, error: medicalError } = await supabase
        .from('medical_records')
        .select('*')
        .eq('care_recipient_id', selectedRecipient.id)
        .order('date', { ascending: false })
      
      if (medicalData && !medicalError) {
        setMedicalRecords(medicalData)
      }
      
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('care_recipient_id', selectedRecipient.id)
        .order('appointment_date', { ascending: true })
      
      if (appointmentsData && !appointmentsError) {
        setAppointments(appointmentsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const categoryIcons = {
    legal: FileText,
    medical: Heart,
    financial: FileCheck,
    identification: User,
  }

  const recordIcons = {
    doctors: Users,
    medications: Pill,
    conditions: AlertCircle,
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      if (!documentForm.name) {
        setDocumentForm({...documentForm, name: file.name})
      }
    }
  }

  const handleAddDocument = async () => {
    if (!selectedRecipient) {
      alert('Please select a care recipient first')
      return
    }
    
    if (!documentForm.name.trim()) {
      alert('Please enter a document name')
      return
    }
    
    setUploadingFile(true)
    
    try {
      let fileUrl = null
      let fileName = null
      let fileSize = null
      
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()
        const filePath = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, selectedFile)
        
        if (uploadError) {
          alert('Error uploading file: ' + uploadError.message)
          setUploadingFile(false)
          return
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath)
        
        fileUrl = publicUrlData.publicUrl
        fileName = selectedFile.name
        fileSize = selectedFile.size
      }
      
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          ...documentForm,
          care_recipient_id: selectedRecipient.id,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize
        }])
        .select()
      
      if (data && !error) {
        setDocuments(prev => [data[0], ...prev])
        setDocumentForm({
          name: '',
          category: 'medical',
          date: new Date().toISOString().split('T')[0]
        })
        setSelectedFile(null)
        setShowDocumentForm(false)
      } else {
        alert('Error adding document: ' + error?.message)
      }
    } catch (error) {
      console.error('Error adding document:', error)
      alert('Error adding document')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleAddMedicalRecord = async () => {
    if (!selectedRecipient) {
      alert('Please select a care recipient first')
      return
    }
    
    if (!medicalForm.name.trim()) {
      alert('Please enter a record name')
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .insert([{
          ...medicalForm,
          care_recipient_id: selectedRecipient.id
        }])
        .select()
      
      if (data && !error) {
        setMedicalRecords(prev => [data[0], ...prev])
        setMedicalForm({
          type: 'medications',
          name: '',
          details: '',
          date: new Date().toISOString().split('T')[0]
        })
        setShowMedicalForm(false)
      } else {
        alert('Error adding medical record: ' + error?.message)
      }
    } catch (error) {
      console.error('Error adding medical record:', error)
      alert('Error adding medical record')
    }
  }
  
    const handleAddAppointment = async () => {
      if (!selectedRecipient) {
        alert('Please select a care recipient first');
        return;
      }
      
      if (!appointmentForm.title.trim()) {
        alert('Please enter an appointment title');
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('appointments')
          .insert([{
            ...appointmentForm,
            care_recipient_id: selectedRecipient.id
          }])
          .select();
        
        if (data && !error) {
          setAppointments(prev => [...prev, data[0]]);
          setAppointmentForm({
            title: '',
            description: '',
            appointment_date: new Date(new Date().setHours(new Date().getHours() + 1)).toISOString().slice(0, 16),
            remind_before_minutes: 30,
            repeat_interval: 'none'
          });
          setShowAppointmentModal(false);
        } else {
          alert('Error adding appointment: ' + error?.message);
        }
      } catch (error) {
        console.error('Error adding appointment:', error);
        alert('Error adding appointment');
      }
    };
    
    const handleDeleteAppointment = async (id: string) => {
      if (!confirm('Are you sure you want to delete this appointment?')) return;
      
      try {
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', id);
        
        if (!error) {
          setAppointments(prev => prev.filter(appt => appt.id !== id));
        } else {
          alert('Error deleting appointment: ' + error.message);
        }
      } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('Error deleting appointment');
      }
    };
    
    const toggleAppointmentCompleted = async (id: string, currentStatus: boolean) => {
      try {
        const { error } = await supabase
          .from('appointments')
          .update({ is_completed: !currentStatus })
          .eq('id', id);
        
        if (!error) {
          setAppointments(prev => 
            prev.map(appt => 
              appt.id === id ? { ...appt, is_completed: !currentStatus } : appt
            )
          );
        } else {
          alert('Error updating appointment: ' + error.message);
        }
      } catch (error) {
        console.error('Error updating appointment:', error);
        alert('Error updating appointment');
      }
    };
    
  const handleAddRecipient = async () => {
    if (!recipientForm.name.trim()) {
      alert('Please enter a name')
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('care_recipients')
        .insert([{
          ...recipientForm,
          is_active: true
        }])
        .select()
      
      if (data && !error) {
        setCareRecipients(prev => [...prev, data[0]])
        setSelectedRecipient(data[0])
        setRecipientForm({
          name: '',
          date_of_birth: '',
          relationship: '',
          notes: ''
        })
        setShowRecipientForm(false)
      } else {
        alert('Error adding care recipient: ' + error?.message)
      }
    } catch (error) {
      console.error('Error adding care recipient:', error)
      alert('Error adding care recipient')
    }
  }

  // Check for upcoming appointments and send notifications
  useEffect(() => {
    const checkUpcomingAppointments = () => {
      const now = new Date();
      
      appointments.forEach(appointment => {
        if (appointment.is_completed) return;
        
        const appointmentTime = new Date(appointment.appointment_date);
        const timeDiffMs = appointmentTime.getTime() - now.getTime();
        const timeDiffMinutes = Math.floor(timeDiffMs / (1000 * 60));
        
        // Check if we should send a reminder (within the remind_before_minutes window)
        if (timeDiffMinutes <= appointment.remind_before_minutes && timeDiffMinutes >= 0) {
          // Check if notification was already sent
          const notificationSentKey = `notification_sent_${appointment.id}`;
          if (!localStorage.getItem(notificationSentKey)) {
            // Request notification permission if not already granted
            if (Notification.permission === 'granted') {
              // Create notification
              new Notification(`Appointment Reminder: ${appointment.title}`, {
                body: `Appointment: ${appointment.title}\nTime: ${appointmentTime.toLocaleString()}\n${appointment.description || ''}`,
                icon: '/favicon.ico', // Use your app icon
                tag: appointment.id
              });
              
              // Mark that notification was sent
              localStorage.setItem(notificationSentKey, 'true');
            } else if (Notification.permission !== 'denied') {
              // Request permission
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification(`Appointment Reminder: ${appointment.title}`, {
                    body: `Appointment: ${appointment.title}\nTime: ${appointmentTime.toLocaleString()}\n${appointment.description || ''}`,
                    icon: '/favicon.ico',
                    tag: appointment.id
                  });
                  localStorage.setItem(notificationSentKey, 'true');
                }
              });
            }
          }
        }
      });
    };
    
    // Initial check
    if (typeof window !== 'undefined' && 'Notification' in window) {
      checkUpcomingAppointments();
    }
    
    // Set interval to check every minute
    const intervalId = setInterval(checkUpcomingAppointments, 60000); // 1 minute
    
    return () => {
      clearInterval(intervalId);
    };
  }, [appointments]);

  const handleDeleteDocument = async (id: string, fileUrl?: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    
    try {
      if (fileUrl) {
        const fileName = fileUrl.split('/').pop()
        if (fileName) {
          await supabase.storage
            .from('documents')
            .remove([fileName])
        }
      }
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
      
      if (!error) {
        setDocuments(prev => prev.filter(doc => doc.id !== id))
      } else {
        alert('Error deleting document: ' + error.message)
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Error deleting document')
    }
  }

  const handleDeleteMedicalRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    
    try {
      const { error } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', id)
      
      if (!error) {
        setMedicalRecords(prev => prev.filter(record => record.id !== id))
      } else {
        alert('Error deleting record: ' + error.message)
      }
    } catch (error) {
      console.error('Error deleting record:', error)
      alert('Error deleting record')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">CareVault</h1>
                {selectedRecipient ? (
                  <p className="text-sm text-muted-foreground">Caring for {selectedRecipient.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Care Assistant</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {careRecipients.length > 0 && (
                <select
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedRecipient?.id || ''}
                  onChange={(e) => {
                    const recipient = careRecipients.find(r => r.id === e.target.value)
                    setSelectedRecipient(recipient || null)
                  }}
                >
                  {careRecipients.map(recipient => (
                    <option key={recipient.id} value={recipient.id}>
                      {recipient.name}
                    </option>
                  ))}
                </select>
              )}
              <Button onClick={() => setShowRecipientForm(true)} variant="outline" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                Add Person
              </Button>
              <Button onClick={() => setShowEmergencySummary(true)} variant="secondary" className="gap-2">
                <AlertCircle className="w-4 h-4" />
                Emergency
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold">Secure Medical Information Management</h2>
              <p className="text-lg text-muted-foreground">
                Convenient document storage, medical record management, and emergency information generation for chronic condition patients
              </p>
              <div className="flex gap-3">
                <Button onClick={() => setShowDocumentForm(true)} size="lg" className="gap-2">
                  <FileText className="w-5 h-5" />
                  Add Document
                </Button>
                <Button onClick={() => setShowMedicalForm(true)} size="lg" variant="secondary" className="gap-2">
                  <Heart className="w-5 h-5" />
                  Add Medical Record
                </Button>
              </div>
            </div>
            <div className="relative h-64 lg:h-80 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Heart className="w-32 h-32 text-primary/30" />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Care Recipient Form Modal */}
        {showRecipientForm && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Add Care Recipient</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowRecipientForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>Add a person you are caring for</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient-name">Name *</Label>
                  <Input
                    id="recipient-name"
                    placeholder="e.g., John Doe"
                    value={recipientForm.name}
                    onChange={(e) => setRecipientForm({...recipientForm, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient-dob">Date of Birth</Label>
                  <Input
                    id="recipient-dob"
                    type="date"
                    value={recipientForm.date_of_birth}
                    onChange={(e) => setRecipientForm({...recipientForm, date_of_birth: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient-relation">Relationship</Label>
                  <Input
                    id="recipient-relation"
                    placeholder="e.g., Parent, Spouse, Child"
                    value={recipientForm.relationship}
                    onChange={(e) => setRecipientForm({...recipientForm, relationship: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient-notes">Notes</Label>
                  <Textarea
                    id="recipient-notes"
                    placeholder="Additional information..."
                    value={recipientForm.notes}
                    onChange={(e) => setRecipientForm({...recipientForm, notes: e.target.value})}
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleAddRecipient} className="flex-1">Add Person</Button>
                  <Button onClick={() => setShowRecipientForm(false)} variant="outline" className="flex-1">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Document Form Modal */}
        {showDocumentForm && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Add New Document</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => {
                    setShowDocumentForm(false)
                    setSelectedFile(null)
                  }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>Upload a document file (PDF, images, etc.)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-file">Upload File (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="doc-file"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="flex-1"
                    />
                    {selectedFile && (
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </span>
                    )}
                  </div>
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-name">Document Name</Label>
                  <Input
                    id="doc-name"
                    placeholder="e.g., Medical Insurance Card"
                    value={documentForm.name}
                    onChange={(e) => setDocumentForm({...documentForm, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-category">Category</Label>
                  <select
                    id="doc-category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={documentForm.category}
                    onChange={(e) => setDocumentForm({...documentForm, category: e.target.value as DocumentCategory})}
                  >
                    <option value="legal">Legal Documents</option>
                    <option value="medical">Medical Documents</option>
                    <option value="financial">Financial Documents</option>
                    <option value="identification">Identification</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-date">Date</Label>
                  <Input
                    id="doc-date"
                    type="date"
                    value={documentForm.date}
                    onChange={(e) => setDocumentForm({...documentForm, date: e.target.value})}
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleAddDocument} className="flex-1 gap-2" disabled={uploadingFile}>
                    {uploadingFile ? (
                      <>
                        <Upload className="w-4 h-4 animate-pulse" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Add Document
                      </>
                    )}
                  </Button>
                  <Button onClick={() => {
                    setShowDocumentForm(false)
                    setSelectedFile(null)
                  }} variant="outline" className="flex-1">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Medical Record Form Modal */}
        {showMedicalForm && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Add Medical Record</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowMedicalForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>Enter medical record information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="med-type">Type</Label>
                  <select
                    id="med-type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={medicalForm.type}
                    onChange={(e) => setMedicalForm({...medicalForm, type: e.target.value as MedicalRecordType})}
                  >
                    <option value="doctors">Doctor Information</option>
                    <option value="medications">Medication</option>
                    <option value="conditions">Medical Condition</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="med-name">Name</Label>
                  <Input
                    id="med-name"
                    placeholder="e.g., Dr. Smith or Aspirin"
                    value={medicalForm.name}
                    onChange={(e) => setMedicalForm({...medicalForm, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="med-details">Details</Label>
                  <Textarea
                    id="med-details"
                    placeholder="e.g., Dosage, contact information, notes..."
                    value={medicalForm.details}
                    onChange={(e) => setMedicalForm({...medicalForm, details: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="med-date">Date</Label>
                  <Input
                    id="med-date"
                    type="date"
                    value={medicalForm.date}
                    onChange={(e) => setMedicalForm({...medicalForm, date: e.target.value})}
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleAddMedicalRecord} className="flex-1">Add Record</Button>
                  <Button onClick={() => setShowMedicalForm(false)} variant="outline" className="flex-1">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Emergency Summary Modal */}
        {showEmergencySummary && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Emergency Information Summary</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowEmergencySummary(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>Quick reference information for emergencies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Primary Doctors</h3>
                  <div className="space-y-2">
                    {medicalRecords.filter((r) => r.type === 'doctors').length > 0 ? (
                      medicalRecords.filter((r) => r.type === 'doctors').map((record) => (
                        <div key={record.id} className="p-3 bg-muted rounded-lg">
                          <p className="font-medium">{record.name}</p>
                          <p className="text-sm text-muted-foreground">{record.details}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No doctor information added yet</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Current Medications</h3>
                  <div className="space-y-2">
                    {medicalRecords.filter((r) => r.type === 'medications').length > 0 ? (
                      medicalRecords.filter((r) => r.type === 'medications').map((record) => (
                        <div key={record.id} className="p-3 bg-muted rounded-lg">
                          <p className="font-medium">{record.name}</p>
                          <p className="text-sm text-muted-foreground">{record.details}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No medications added yet</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Medical History</h3>
                  <div className="space-y-2">
                    {medicalRecords.filter((r) => r.type === 'conditions').length > 0 ? (
                      medicalRecords.filter((r) => r.type === 'conditions').map((record) => (
                        <div key={record.id} className="p-3 bg-muted rounded-lg">
                          <p className="font-medium">{record.name}</p>
                          <p className="text-sm text-muted-foreground">{record.details}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No medical conditions added yet</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="flex-1" onClick={() => window.print()}>Print Summary</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowEmergencySummary(false)}>Close</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Documents Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Document Management</h2>
              <Button onClick={() => setShowDocumentForm(true)} size="sm" variant="outline">
                Add Document
              </Button>
            </div>

            <div className="grid gap-4">
              {['legal', 'medical', 'financial', 'identification'].map((category) => {
                const Icon = categoryIcons[category as DocumentCategory]
                const categoryDocs = documents.filter((d) => d.category === category)
                const categoryNames = {
                  legal: 'Legal Documents',
                  medical: 'Medical Documents',
                  financial: 'Financial Documents',
                  identification: 'Identification',
                }

                return (
                  <Card key={category}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {categoryNames[category as DocumentCategory]}
                          </CardTitle>
                          <CardDescription>{categoryDocs.length} documents</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {categoryDocs.length > 0 ? (
                        <div className="space-y-2">
                          {categoryDocs.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-2 rounded bg-muted/50 group">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{doc.name}</span>
                                  {doc.file_url && (
                                    <a
                                      href={doc.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:text-primary/80"
                                      title="View file"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{doc.date}</span>
                                  {doc.file_size && (
                                    <>
                                      <span>•</span>
                                      <span>{formatFileSize(doc.file_size)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteDocument(doc.id, doc.file_url)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No documents yet</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Medical Records Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Medical Records</h2>
              <Button onClick={() => setShowMedicalForm(true)} size="sm" variant="outline">
                Add Record
              </Button>
            </div>

            <div className="grid gap-4">
              {['doctors', 'medications', 'conditions'].map((type) => {
                const Icon = recordIcons[type as MedicalRecordType]
                const typeRecords = medicalRecords.filter((r) => r.type === type)
                const typeNames = {
                  doctors: 'Doctor Information',
                  medications: 'Medication List',
                  conditions: 'Medical Conditions',
                }

                return (
                  <Card key={type}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-secondary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{typeNames[type as MedicalRecordType]}</CardTitle>
                          <CardDescription>{typeRecords.length} records</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {typeRecords.length > 0 ? (
                        <div className="space-y-2">
                          {typeRecords.map((record) => (
                            <div key={record.id} className="flex flex-col gap-1 p-2 rounded bg-muted/50 group relative">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <span className="text-sm font-medium">{record.name}</span>
                                  <p className="text-xs text-muted-foreground mt-1">{record.details}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleDeleteMedicalRecord(record.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No records yet</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Commonly used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setShowDocumentForm(true)}>
                <Upload className="w-6 h-6" />
                <span>Upload Document</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setShowMedicalForm(true)}>
                <Pill className="w-6 h-6" />
                <span>Add Medication</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setShowAppointmentList(!showAppointmentList)}>
                <Calendar className="w-6 h-6" />
                <span>Appointment Reminder</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setShowEmergencySummary(true)}>
                <AlertCircle className="w-6 h-6" />
                <span>Emergency Summary</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Appointment Modal */}
        {showAppointmentModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Add Appointment</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      setShowAppointmentModal(false);
                      setAppointmentForm({
                        title: '',
                        description: '',
                        appointment_date: new Date(new Date().setHours(new Date().getHours() + 1)).toISOString().slice(0, 16),
                        remind_before_minutes: 30,
                        repeat_interval: 'none'
                      });
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>Schedule an appointment and get reminders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apt-title">Title *</Label>
                  <Input
                    id="apt-title"
                    placeholder="e.g., Doctor's appointment"
                    value={appointmentForm.title}
                    onChange={(e) => setAppointmentForm({...appointmentForm, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apt-desc">Description</Label>
                  <Textarea
                    id="apt-desc"
                    placeholder="Additional details"
                    value={appointmentForm.description}
                    onChange={(e) => setAppointmentForm({...appointmentForm, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apt-date">Appointment Date & Time</Label>
                  <Input
                    id="apt-date"
                    type="datetime-local"
                    value={appointmentForm.appointment_date}
                    onChange={(e) => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apt-reminder">Remind Before (minutes)</Label>
                  <Input
                    id="apt-reminder"
                    type="number"
                    min="0"
                    max="1440" // Maximum 24 hours
                    value={appointmentForm.remind_before_minutes}
                    onChange={(e) => setAppointmentForm({...appointmentForm, remind_before_minutes: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apt-repeat">Repeat Interval</Label>
                  <select
                    id="apt-repeat"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={appointmentForm.repeat_interval}
                    onChange={(e) => setAppointmentForm({...appointmentForm, repeat_interval: e.target.value as RepeatInterval})}
                  >
                    <option value="none">No Repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleAddAppointment} 
                    className="flex-1"
                  >
                    Add Appointment
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowAppointmentModal(false);
                      setAppointmentForm({
                        title: '',
                        description: '',
                        appointment_date: new Date(new Date().setHours(new Date().getHours() + 1)).toISOString().slice(0, 16),
                        remind_before_minutes: 30,
                        repeat_interval: 'none'
                      });
                    }} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Appointment List */}
        {showAppointmentList && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Appointments</CardTitle>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => {
                    setShowAppointmentList(false);
                    setShowAppointmentModal(true); // Open modal to add new appointment
                  }}
                >
                  <Calendar className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>Manage your appointments and reminders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Upcoming Appointments */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Upcoming Appointments ({upcomingAppointments.length})
                  </h3>
                  {upcomingAppointments.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingAppointments.map((appointment) => {
                        const date = new Date(appointment.appointment_date);
                        const formattedDate = date.toLocaleDateString();
                        const formattedTime = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        
                        return (
                          <Card key={appointment.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium">{appointment.title}</h4>
                                {appointment.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{appointment.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {formattedDate} at {formattedTime}
                                  </span>
                                  {appointment.remind_before_minutes > 0 && (
                                    <span className="flex items-center gap-1">
                                      <AlertCircle className="w-4 h-4" />
                                      Remind {appointment.remind_before_minutes} min before
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  onClick={() => toggleAppointmentCompleted(appointment.id, appointment.is_completed)}
                                  title={appointment.is_completed ? 'Mark as incomplete' : 'Mark as completed'}
                                >
                                  {appointment.is_completed ? <Download className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="icon" 
                                  onClick={() => handleDeleteAppointment(appointment.id)}
                                  title="Delete appointment"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No upcoming appointments</p>
                  )}
                </div>
                
                {/* Past Appointments */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    Past Appointments ({pastAppointments.length})
                  </h3>
                  {pastAppointments.length > 0 ? (
                    <div className="space-y-3">
                      {pastAppointments.map((appointment) => {
                        const date = new Date(appointment.appointment_date);
                        const formattedDate = date.toLocaleDateString();
                        const formattedTime = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        
                        return (
                          <Card key={appointment.id} className={`p-4 ${appointment.is_completed ? 'opacity-70' : ''}`}>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium flex items-center gap-2">
                                  {appointment.title}
                                  {appointment.is_completed && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Completed</span>
                                  )}
                                </h4>
                                {appointment.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{appointment.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {formattedDate} at {formattedTime}
                                  </span>
                                  {appointment.remind_before_minutes > 0 && (
                                    <span className="flex items-center gap-1">
                                      <AlertCircle className="w-4 h-4" />
                                      Was reminded {appointment.remind_before_minutes} min before
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {!appointment.is_completed && (
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => toggleAppointmentCompleted(appointment.id, appointment.is_completed)}
                                    title="Mark as completed"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="destructive" 
                                  size="icon" 
                                  onClick={() => handleDeleteAppointment(appointment.id)}
                                  title="Delete appointment"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No past appointments</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

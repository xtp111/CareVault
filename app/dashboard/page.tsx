'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Heart, Pill, User, Users, AlertCircle, FileCheck, Calendar, X, Trash2, Upload, Download, ExternalLink, Edit, Shield } from 'lucide-react'
import { ProtectedRoute, useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import EmergencySummary from '@/components/EmergencySummary'
import { 
  careRecipientService,
  medicalRecordService,
  appointmentService, 
  documentService,
  emergencyContactService
} from '@/lib/supabase-service'
import type { 
  CareRecipient,
  MedicalRecord,
  Appointment, 
  DocumentRecord,
  AppointmentStatus
} from '@/types/supabase'

type DocumentCategory = 'legal' | 'medical' | 'financial' | 'identification'

function CaregiverDashboard() {
  const { user, userRole, userProfile } = useAuth()
  const permissions = usePermissions()
  
  const [patients, setPatients] = useState<CareRecipient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<CareRecipient | null>(null)
  const [medications, setMedications] = useState<MedicalRecord[]>([])
  const [careLogs, setCareLogs] = useState<MedicalRecord[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [showMedicationForm, setShowMedicationForm] = useState(false)
  const [showCareLogForm, setShowCareLogForm] = useState(false)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [showDocumentForm, setShowDocumentForm] = useState(false)
  const [showEmergencySummary, setShowEmergencySummary] = useState(false)
  
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [patientForm, setPatientForm] = useState({
    patient_email: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    diagnosis: '',
    medications: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: ''
  })

  const [medicationForm, setMedicationForm] = useState({
    name: '',
    details: '',
    date: new Date().toISOString().split('T')[0]
  })

  const [careLogForm, setCareLogForm] = useState({
    name: '',
    details: '',
    date: new Date().toISOString().split('T')[0]
  })

  const [appointmentForm, setAppointmentForm] = useState({
    title: '',
    description: '',
    appointmentDate: new Date(new Date().setHours(new Date().getHours() + 1)).toISOString().slice(0, 16),
    location: '',
    remindBeforeMinutes: 30,
    repeatInterval: 'none' as 'none' | 'daily' | 'weekly' | 'monthly'
  })

  const [documentForm, setDocumentForm] = useState({
    name: '',
    category: 'medical' as DocumentCategory,
    date: new Date().toISOString().split('T')[0]
  })

  // Load patients on mount
  useEffect(() => {
    if (!user || !userProfile) return
    
    const loadPatients = async () => {
      if (permissions.isCaregiver) {
        // Caregiver: Load all care recipients they manage
        const careRecipients = await careRecipientService.getCareRecipientsByCaregiver(user.id)
        setPatients(careRecipients)
        if (careRecipients.length > 0) {
          setSelectedPatient(careRecipients[0])
        }
      } else if (permissions.isPatient && userProfile.email) {
        // Patient: Load their own care recipient record
        const careRecipient = await careRecipientService.getCareRecipientByEmail(userProfile.email)
        if (careRecipient) {
          setPatients([careRecipient])
          setSelectedPatient(careRecipient)
        }
      }
    }
    
    loadPatients()
  }, [user, userProfile, permissions.isCaregiver, permissions.isPatient])

  // Load patient data when selected patient changes
  useEffect(() => {
    if (!selectedPatient) return

    const loadPatientData = async () => {
      const [meds, logs, appts, docs] = await Promise.all([
        medicalRecordService.getActiveMedications(selectedPatient.id),
        medicalRecordService.getMedicalRecords(selectedPatient.id),
        appointmentService.getAppointments(selectedPatient.id),
        documentService.getDocuments(selectedPatient.id)
      ])

      setMedications(meds)
      setCareLogs(logs)
      setAppointments(appts)
      setDocuments(docs)
    }

    loadPatientData()
  }, [selectedPatient])

  // Patient Management
  const handleAddPatient = async () => {
    if (!user || !permissions.hasPermission('canEditPatientInfo')) return

    try {
      const patientId = await careRecipientService.createCareRecipient({
        caregiver_id: user.id,
        patient_email: patientForm.patient_email || undefined,
        first_name: patientForm.first_name,
        last_name: patientForm.last_name,
        date_of_birth: patientForm.date_of_birth,
        diagnosis: patientForm.diagnosis || undefined,
        allergies: patientForm.allergies || undefined,
        emergency_contact_name: patientForm.emergency_contact_name || undefined,
        emergency_contact_phone: patientForm.emergency_contact_phone || undefined,
        emergency_contact_relationship: patientForm.emergency_contact_relationship || undefined,
        is_active: true
      })

      const newPatient = await careRecipientService.getCareRecipient(patientId)
      if (newPatient) {
        setPatients([...patients, newPatient])
        setSelectedPatient(newPatient)
      }

      setShowPatientForm(false)
      resetPatientForm()
    } catch (error: any) {
      console.error('Error adding patient:', error)
      const errorMessage = error?.message || error?.error_description || error?.details || 'Failed to add patient'
      alert(`Failed to add patient: ${errorMessage}`)
    }
  }

  const handleUpdatePatient = async () => {
    if (!selectedPatient || !permissions.hasPermission('canEditPatientInfo')) return

    try {
      await careRecipientService.updateCareRecipient(selectedPatient.id, {
        patient_email: patientForm.patient_email || undefined,
        first_name: patientForm.first_name,
        last_name: patientForm.last_name,
        date_of_birth: patientForm.date_of_birth,
        diagnosis: patientForm.diagnosis || undefined,
        allergies: patientForm.allergies || undefined,
        emergency_contact_name: patientForm.emergency_contact_name || undefined,
        emergency_contact_phone: patientForm.emergency_contact_phone || undefined,
        emergency_contact_relationship: patientForm.emergency_contact_relationship || undefined
      })
      
      const updatedPatient = { ...selectedPatient, ...patientForm }
      setSelectedPatient(updatedPatient as CareRecipient)
      setPatients(patients.map(p => p.id === selectedPatient.id ? updatedPatient as CareRecipient : p))
      
      setShowPatientForm(false)
    } catch (error) {
      console.error('Error updating patient:', error)
      alert('Failed to update patient')
    }
  }

  const handleDeletePatient = async (id: string) => {
    if (!permissions.hasPermission('canEditPatientInfo')) return
    
    if (!confirm('Are you sure you want to delete this patient? All associated data will be removed.')) {
      return
    }

    try {
      await careRecipientService.deleteCareRecipient(id)
      const remaining = patients.filter(p => p.id !== id)
      setPatients(remaining)
      setSelectedPatient(remaining.length > 0 ? remaining[0] : null)
    } catch (error) {
      console.error('Error deleting patient:', error)
      alert('Failed to delete patient')
    }
  }

  // Medication Management
  const handleAddMedication = async () => {
    if (!selectedPatient || !permissions.hasPermission('canManageMedications')) return

    try {
      const medId = await medicalRecordService.createMedicalRecord({
        care_recipient_id: selectedPatient.id,
        type: 'medication',
        title: medicationForm.name,
        description: medicationForm.details,
        date: medicationForm.date,
        is_active: true
      })

      const newMedication: MedicalRecord = {
        id: medId,
        care_recipient_id: selectedPatient.id,
        type: 'medication',
        title: medicationForm.name,
        description: medicationForm.details,
        date: medicationForm.date,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setMedications([...medications, newMedication])
      setShowMedicationForm(false)
      resetMedicationForm()
    } catch (error) {
      console.error('Error adding medication:', error)
      alert('Failed to add medication')
    }
  }

  const handleDeleteMedication = async (id: string) => {
    if (!permissions.hasPermission('canManageMedications')) return

    try {
      await medicalRecordService.deleteMedicalRecord(id)
      setMedications(medications.filter(m => m.id !== id))
    } catch (error) {
      console.error('Error deleting medication:', error)
      alert('Failed to delete medication')
    }
  }

  // Care Log Management
  const handleAddCareLog = async () => {
    if (!selectedPatient || !user || !permissions.hasPermission('canAddCareLogs')) return

    try {
      const logId = await medicalRecordService.createMedicalRecord({
        care_recipient_id: selectedPatient.id,
        type: 'condition',
        title: careLogForm.name,
        description: careLogForm.details,
        date: careLogForm.date,
        is_active: true
      })

      const newLog: MedicalRecord = {
        id: logId,
        care_recipient_id: selectedPatient.id,
        type: 'condition',
        title: careLogForm.name,
        description: careLogForm.details,
        date: careLogForm.date,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setCareLogs([newLog, ...careLogs])
      setShowCareLogForm(false)
      resetCareLogForm()
    } catch (error) {
      console.error('Error adding care log:', error)
      alert('Failed to add care log')
    }
  }

  const handleDeleteCareLog = async (id: string) => {
    if (!permissions.hasPermission('canDeleteCareLogs')) return

    try {
      await medicalRecordService.deleteMedicalRecord(id)
      setCareLogs(careLogs.filter(l => l.id !== id))
    } catch (error) {
      console.error('Error deleting care log:', error)
      alert('Failed to delete care log')
    }
  }

  // Appointment Management
  const handleAddAppointment = async () => {
    if (!selectedPatient || !permissions.hasPermission('canManageAppointments')) return

    try {
      const apptId = await appointmentService.createAppointment({
        care_recipient_id: selectedPatient.id,
        appointment_date: appointmentForm.appointmentDate,
        title: appointmentForm.title,
        description: appointmentForm.description,
        location: appointmentForm.location,
        status: 'scheduled'
      })

      const newAppointment: Appointment = {
        id: apptId,
        care_recipient_id: selectedPatient.id,
        appointment_date: appointmentForm.appointmentDate,
        title: appointmentForm.title,
        description: appointmentForm.description,
        location: appointmentForm.location,
        status: 'scheduled' as AppointmentStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Appointment

      setAppointments([...appointments, newAppointment])
      setShowAppointmentForm(false)
      resetAppointmentForm()
    } catch (error) {
      console.error('Error adding appointment:', error)
      alert('Failed to add appointment')
    }
  }

  const handleToggleAppointment = async (id: string, isCompleted: boolean) => {
    if (!permissions.hasPermission('canManageAppointments')) return

    try {
      await appointmentService.updateAppointment(id, { status: isCompleted ? 'scheduled' : 'completed' })
      setAppointments(appointments.map(a => 
        a.id === id ? { ...a, status: isCompleted ? 'scheduled' : 'completed' } : a
      ))
    } catch (error) {
      console.error('Error updating appointment:', error)
      alert('Failed to update appointment')
    }
  }

  const handleDeleteAppointment = async (id: string) => {
    if (!permissions.hasPermission('canManageAppointments')) return

    try {
      await appointmentService.deleteAppointment(id)
      setAppointments(appointments.filter(a => a.id !== id))
    } catch (error) {
      console.error('Error deleting appointment:', error)
      alert('Failed to delete appointment')
    }
  }

  // Document Management
  const handleUploadDocument = async () => {
    if (!selectedPatient || !selectedFile || !permissions.hasPermission('canUploadDocuments')) return

    setUploadingFile(true)
    try {
      await documentService.uploadDocument(selectedFile, selectedPatient.id, {
        name: documentForm.name,
        category: documentForm.category,
        description: documentForm.date
      })

      // Reload documents
      const docs = await documentService.getDocuments(selectedPatient.id)
      setDocuments(docs)

      setShowDocumentForm(false)
      resetDocumentForm()
      setSelectedFile(null)
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Failed to upload document')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleDeleteDocument = async (id: string, fileUrl: string) => {
    if (!permissions.hasPermission('canDeleteDocuments')) return

    try {
      await documentService.deleteDocument(id, fileUrl)
      setDocuments(documents.filter(d => d.id !== id))
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document')
    }
  }

  // Form reset helpers
  const resetPatientForm = () => {
    setPatientForm({
      patient_email: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      diagnosis: '',
      medications: '',
      allergies: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relationship: ''
    })
  }

  const resetMedicationForm = () => {
    setMedicationForm({
      name: '',
      details: '',
      date: new Date().toISOString().split('T')[0]
    })
  }

  const resetCareLogForm = () => {
    setCareLogForm({
      name: '',
      details: '',
      date: new Date().toISOString().split('T')[0]
    })
  }

  const resetAppointmentForm = () => {
    setAppointmentForm({
      title: '',
      description: '',
      appointmentDate: new Date(new Date().setHours(new Date().getHours() + 1)).toISOString().slice(0, 16),
      location: '',
      remindBeforeMinutes: 30,
      repeatInterval: 'none'
    })
  }

  const resetDocumentForm = () => {
    setDocumentForm({
      name: '',
      category: 'medical',
      date: new Date().toISOString().split('T')[0]
    })
  }

  const upcomingAppointments = appointments
    .filter(a => a.status === 'scheduled' && new Date(a.appointment_date) > new Date())
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())

  const pastAppointments = appointments
    .filter(a => a.status !== 'scheduled' || new Date(a.appointment_date) <= new Date())
    .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())

  const activeMedications = medications

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
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  <p className="text-xs text-muted-foreground">
                    {userRole === 'caregiver' ? 'Caregiver Portal' : 'Patient Portal (Read-Only)'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedPatient && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowEmergencySummary(true)}
                    className="gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Emergency Summary
                  </Button>
                  
                  {permissions.isCaregiver && patients.length > 1 && (
                    <select
                      value={selectedPatient.id}
                      onChange={(e) => {
                        const patient = patients.find(p => p.id === e.target.value)
                        setSelectedPatient(patient || null)
                      }}
                      className="px-3 py-2 border rounded-lg"
                    >
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                      ))}
                    </select>
                  )}
                </>
              )}
              
              {permissions.isCaregiver && (
                <Button onClick={() => setShowPatientForm(true)}>
                  <Users className="w-4 h-4 mr-2" />
                  Add Patient
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!selectedPatient ? (
          permissions.isCaregiver ? (
            // Caregiver Empty State - Distinct from Patient Portal
            <div className="max-w-4xl mx-auto">
              <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold mb-3 text-primary">Welcome to CareVault</h2>
                  <p className="text-lg text-muted-foreground mb-2">
                    Start managing care by adding your first patient
                  </p>
                  <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
                    As a caregiver, you can track medications, appointments, medical records, and care logs for all your patients in one secure place.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => setShowPatientForm(true)}
                    className="gap-2"
                  >
                    <Users className="w-5 h-5" />
                    Add Your First Patient
                  </Button>
                  
                  <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Pill className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold mb-1">Track Medications</h3>
                      <p className="text-sm text-muted-foreground">Manage prescriptions and dosages</p>
                    </div>
                    <div className="text-center p-4">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-green-100 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold mb-1">Schedule Appointments</h3>
                      <p className="text-sm text-muted-foreground">Never miss a doctor visit</p>
                    </div>
                    <div className="text-center p-4">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-purple-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold mb-1">Store Documents</h3>
                      <p className="text-sm text-muted-foreground">Keep all records organized</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Patient Empty State - When patient has no care_recipient record
            <Card className="text-center py-12 border-orange-200 bg-orange-50/50">
              <CardContent>
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-orange-500" />
                <h2 className="text-2xl font-bold mb-2">No Care Record Found</h2>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Your caregiver needs to add you as a patient to their care list. Please contact your caregiver to link your account.
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-white px-4 py-2 rounded-lg border">
                  <Shield className="w-4 h-4" />
                  <span>Patient Portal (Read-Only Access)</span>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient Profile */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedPatient.first_name} {selectedPatient.last_name}</CardTitle>
                    <CardDescription>
                      Born: {new Date(selectedPatient.date_of_birth).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {permissions.hasPermission('canEditPatientInfo') && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setPatientForm({
                            patient_email: selectedPatient.patient_email || '',
                            first_name: selectedPatient.first_name,
                            last_name: selectedPatient.last_name,
                            date_of_birth: selectedPatient.date_of_birth,
                            diagnosis: selectedPatient.diagnosis || '',
                            medications: '',
                            allergies: selectedPatient.allergies || '',
                            emergency_contact_name: selectedPatient.emergency_contact_name || '',
                            emergency_contact_phone: selectedPatient.emergency_contact_phone || '',
                            emergency_contact_relationship: selectedPatient.emergency_contact_relationship || ''
                          })
                          setShowPatientForm(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {patients.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeletePatient(selectedPatient.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPatient.emergency_contact_name && (
                    <div>
                      <p className="text-sm font-medium">Emergency Contact</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPatient.emergency_contact_name} • {selectedPatient.emergency_contact_phone}
                      </p>
                    </div>
                  )}
                  {selectedPatient.allergies && (
                    <div>
                      <p className="text-sm font-medium">Allergies</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPatient.allergies}
                      </p>
                    </div>
                  )}
                  {selectedPatient.diagnosis && (
                    <div>
                      <p className="text-sm font-medium">Diagnosis</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPatient.diagnosis}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Medications */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="w-5 h-5" />
                    <CardTitle>Medications</CardTitle>
                  </div>
                  {permissions.hasPermission('canManageMedications') && (
                    <Button size="sm" onClick={() => setShowMedicationForm(true)}>
                      Add
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {activeMedications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active medications
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activeMedications.map(med => (
                      <div key={med.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{med.title}</p>
                            {med.description && <p className="text-sm text-muted-foreground">{med.description}</p>}
                            <p className="text-xs text-muted-foreground">{new Date(med.date).toLocaleDateString()}</p>
                          </div>
                          {permissions.hasPermission('canManageMedications') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteMedication(med.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Appointments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <CardTitle>Appointments</CardTitle>
                  </div>
                  {permissions.hasPermission('canManageAppointments') && (
                    <Button size="sm" onClick={() => setShowAppointmentForm(true)}>
                      Add
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming appointments
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingAppointments.slice(0, 5).map(appt => (
                      <div key={appt.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{appt.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(appt.appointment_date).toLocaleString()}
                            </p>
                          </div>
                          {permissions.hasPermission('canManageAppointments') && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleToggleAppointment(appt.id, appt.status === 'completed')}
                              >
                                <FileCheck className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDeleteAppointment(appt.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    <CardTitle>Documents</CardTitle>
                  </div>
                  {permissions.hasPermission('canUploadDocuments') && (
                    <Button size="sm" onClick={() => setShowDocumentForm(true)}>
                      Upload
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No documents uploaded
                  </p>
                ) : (
                  <div className="space-y-2">
                    {documents.slice(0, 5).map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2 flex-1">
                          <FileText className="w-4 h-4" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.category}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          {permissions.hasPermission('canDeleteDocuments') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteDocument(doc.id, doc.file_url || '')}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Care Logs */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Care Logs</CardTitle>
                  {permissions.hasPermission('canAddCareLogs') && (
                    <Button onClick={() => setShowCareLogForm(true)}>
                      Add Log
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {careLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No care logs yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {careLogs.slice(0, 10).map(log => (
                      <div key={log.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium mb-1">{log.title}</p>
                            {log.description && <p className="text-sm text-muted-foreground">{log.description}</p>}
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.date).toLocaleDateString()}
                            </span>
                          </div>
                          {permissions.hasPermission('canDeleteCareLogs') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteCareLog(log.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Patient Form Modal */}
      {showPatientForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedPatient ? 'Edit Patient' : 'Add New Patient'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowPatientForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Patient Email *</Label>
                  <Input
                    type="email"
                    value={patientForm.patient_email}
                    onChange={(e) => setPatientForm({ ...patientForm, patient_email: e.target.value })}
                    placeholder="patient@example.com"
                  />
                </div>
                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={patientForm.first_name}
                    onChange={(e) => setPatientForm({ ...patientForm, first_name: e.target.value })}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={patientForm.last_name}
                    onChange={(e) => setPatientForm({ ...patientForm, last_name: e.target.value })}
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <Label>Date of Birth *</Label>
                  <Input
                    type="date"
                    value={patientForm.date_of_birth}
                    onChange={(e) => setPatientForm({ ...patientForm, date_of_birth: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Diagnosis</Label>
                  <Input
                    value={patientForm.diagnosis}
                    onChange={(e) => setPatientForm({ ...patientForm, diagnosis: e.target.value })}
                    placeholder="Primary diagnosis"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Emergency Contact Name</Label>
                  <Input
                    value={patientForm.emergency_contact_name}
                    onChange={(e) => setPatientForm({ ...patientForm, emergency_contact_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Emergency Contact Phone</Label>
                  <Input
                    value={patientForm.emergency_contact_phone}
                    onChange={(e) => setPatientForm({ ...patientForm, emergency_contact_phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Relationship</Label>
                  <Input
                    value={patientForm.emergency_contact_relationship}
                    onChange={(e) => setPatientForm({ ...patientForm, emergency_contact_relationship: e.target.value })}
                    placeholder="e.g., Spouse, Child"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Allergies</Label>
                  <Input
                    value={patientForm.allergies}
                    onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })}
                    placeholder="Penicillin, Peanuts, etc."
                  />
                </div>
                <div className="col-span-2">
                  <Label>Current Medications</Label>
                  <Textarea
                    value={patientForm.medications}
                    onChange={(e) => setPatientForm({ ...patientForm, medications: e.target.value })}
                    rows={3}
                    placeholder="List current medications"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPatientForm(false)}>
                  Cancel
                </Button>
                <Button onClick={selectedPatient ? handleUpdatePatient : handleAddPatient}>
                  {selectedPatient ? 'Update' : 'Add'} Patient
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Medication Form Modal */}
      {showMedicationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Medication</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowMedicationForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Medication Name *</Label>
                <Input
                  value={medicationForm.name}
                  onChange={(e) => setMedicationForm({ ...medicationForm, name: e.target.value })}
                  placeholder="e.g., Aspirin"
                />
              </div>
              <div>
                <Label>Details (dosage, frequency, instructions)</Label>
                <Textarea
                  value={medicationForm.details}
                  onChange={(e) => setMedicationForm({ ...medicationForm, details: e.target.value })}
                  placeholder="e.g., 100mg twice daily with food"
                  rows={3}
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={medicationForm.date}
                  onChange={(e) => setMedicationForm({ ...medicationForm, date: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowMedicationForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMedication}>
                  Add Medication
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Care Log Form Modal */}
      {showCareLogForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Care Log</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCareLogForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Log Name *</Label>
                <Input
                  value={careLogForm.name}
                  onChange={(e) => setCareLogForm({ ...careLogForm, name: e.target.value })}
                  placeholder="Brief summary"
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={careLogForm.details}
                  onChange={(e) => setCareLogForm({ ...careLogForm, details: e.target.value })}
                  placeholder="Detailed notes"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCareLogForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCareLog}>
                  Add Log
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Appointment Form Modal */}
      {showAppointmentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Appointment</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowAppointmentForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={appointmentForm.title}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, title: e.target.value })}
                  placeholder="Doctor's appointment"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={appointmentForm.description}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, description: e.target.value })}
                  placeholder="Additional details"
                  rows={2}
                />
              </div>
              <div>
                <Label>Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={appointmentForm.appointmentDate}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Remind Before (minutes)</Label>
                  <Input
                    type="number"
                    value={appointmentForm.remindBeforeMinutes}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, remindBeforeMinutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Repeat</Label>
                  <select
                    value={appointmentForm.repeatInterval}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, repeatInterval: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAppointmentForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAppointment}>
                  Add Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Document Upload Form Modal */}
      {showDocumentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upload Document</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowDocumentForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Document Name *</Label>
                <Input
                  value={documentForm.name}
                  onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
                  placeholder="e.g., Medical Report"
                />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={documentForm.category}
                  onChange={(e) => setDocumentForm({ ...documentForm, category: e.target.value as DocumentCategory })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="medical">Medical</option>
                  <option value="legal">Legal</option>
                  <option value="financial">Financial</option>
                  <option value="identification">Identification</option>
                </select>
              </div>
              <div>
                <Label>File *</Label>
                <Input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDocumentForm(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUploadDocument}
                  disabled={uploadingFile || !selectedFile || !documentForm.name}
                >
                  {uploadingFile ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Emergency Summary Modal */}
      {showEmergencySummary && selectedPatient && (
        <EmergencySummary
          patient={selectedPatient}
          medications={medications}
          onClose={() => setShowEmergencySummary(false)}
        />
      )}
    </div>
  )
}

export default function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <CaregiverDashboard />
    </ProtectedRoute>
  )
}

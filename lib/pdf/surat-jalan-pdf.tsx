import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { PDFHeader } from './components/pdf-header'
import { PDFFooter } from './components/pdf-footer'
import { SignatureBlock } from './components/signature-block'
import { CompanySettingsForPDF, formatDateForPDF } from './pdf-utils'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    padding: 6,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
  },
  fullWidthItem: {
    width: '100%',
    marginBottom: 8,
  },
  routeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  routeBox: {
    width: '45%',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  routeLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 4,
  },
  routeValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  routeArrow: {
    width: '10%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: '#666',
  },
  cargoTable: {
    marginTop: 10,
  },
  cargoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 6,
  },
  cargoLabel: {
    width: '30%',
    fontSize: 9,
    color: '#666',
  },
  cargoValue: {
    width: '70%',
    fontSize: 10,
  },
  notesSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#444',
  },
})

export interface SuratJalanPDFProps {
  suratJalan: {
    sj_number: string
    delivery_date: string
    vehicle_plate?: string
    driver_name?: string
    driver_phone?: string
    origin?: string
    destination?: string
    cargo_description?: string
    quantity?: number
    quantity_unit?: string
    weight_kg?: number
    sender_name?: string
    receiver_name?: string
    notes?: string
  }
  jobOrder: {
    jo_number: string
  }
  company: CompanySettingsForPDF
}

export function SuratJalanPDF({
  suratJalan,
  jobOrder,
  company,
}: SuratJalanPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <PDFHeader
          company={company}
          documentTitle="SURAT JALAN"
          documentNumber={suratJalan.sj_number}
          documentDate={formatDateForPDF(suratJalan.delivery_date)}
          additionalInfo={[
            { label: 'JO Ref', value: jobOrder.jo_number },
          ]}
        />

        {/* Route Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Information</Text>
          <View style={styles.routeContainer}>
            <View style={styles.routeBox}>
              <Text style={styles.routeLabel}>Origin</Text>
              <Text style={styles.routeValue}>{suratJalan.origin || '-'}</Text>
            </View>
            <View style={styles.routeArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
            <View style={styles.routeBox}>
              <Text style={styles.routeLabel}>Destination</Text>
              <Text style={styles.routeValue}>{suratJalan.destination || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Vehicle & Driver Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle & Driver</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Vehicle Plate</Text>
              <Text style={styles.infoValue}>{suratJalan.vehicle_plate || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Driver Name</Text>
              <Text style={styles.infoValue}>{suratJalan.driver_name || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Driver Phone</Text>
              <Text style={styles.infoValue}>{suratJalan.driver_phone || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Cargo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cargo Details</Text>
          <View style={styles.cargoTable}>
            <View style={styles.cargoRow}>
              <Text style={styles.cargoLabel}>Description</Text>
              <Text style={styles.cargoValue}>{suratJalan.cargo_description || '-'}</Text>
            </View>
            <View style={styles.cargoRow}>
              <Text style={styles.cargoLabel}>Quantity</Text>
              <Text style={styles.cargoValue}>
                {suratJalan.quantity ? `${suratJalan.quantity} ${suratJalan.quantity_unit || ''}` : '-'}
              </Text>
            </View>
            <View style={styles.cargoRow}>
              <Text style={styles.cargoLabel}>Weight</Text>
              <Text style={styles.cargoValue}>
                {suratJalan.weight_kg ? `${suratJalan.weight_kg.toLocaleString('id-ID')} kg` : '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {suratJalan.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{suratJalan.notes}</Text>
          </View>
        )}

        {/* Signature Block */}
        <SignatureBlock
          leftLabel="Sender"
          leftName={suratJalan.sender_name}
          rightLabel="Receiver"
          rightName={suratJalan.receiver_name}
        />

        {/* Footer */}
        <PDFFooter message="Please sign upon receipt of goods" />
      </Page>
    </Document>
  )
}

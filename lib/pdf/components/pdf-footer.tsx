import { View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  message: {
    marginBottom: 4,
  },
  pageNumber: {
    fontSize: 8,
    color: '#999',
  },
})

interface PDFFooterProps {
  message?: string
  showPageNumber?: boolean
}

export function PDFFooter({
  message = 'Thank you for your business',
  showPageNumber = false,
}: PDFFooterProps) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.message}>{message}</Text>
      {showPageNumber && (
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      )}
    </View>
  )
}

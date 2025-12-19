import { View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  signatureBlock: {
    width: '45%',
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  name: {
    fontSize: 10,
    marginBottom: 50,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 5,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
  },
})

interface SignatureBlockProps {
  leftLabel: string
  leftName?: string
  rightLabel: string
  rightName?: string
}

export function SignatureBlock({
  leftLabel,
  leftName,
  rightLabel,
  rightName,
}: SignatureBlockProps) {
  return (
    <View style={styles.container}>
      <View style={styles.signatureBlock}>
        <Text style={styles.label}>{leftLabel}</Text>
        {leftName && <Text style={styles.name}>{leftName}</Text>}
        <View style={styles.signatureLine}>
          <Text style={styles.signatureLabel}>
            {leftName ? `(${leftName})` : '(                                        )'}
          </Text>
        </View>
      </View>
      <View style={styles.signatureBlock}>
        <Text style={styles.label}>{rightLabel}</Text>
        {rightName && <Text style={styles.name}>{rightName}</Text>}
        <View style={styles.signatureLine}>
          <Text style={styles.signatureLabel}>
            {rightName ? `(${rightName})` : '(                                        )'}
          </Text>
        </View>
      </View>
    </View>
  )
}

interface SingleSignatureBlockProps {
  label: string
  name?: string
}

export function SingleSignatureBlock({ label, name }: SingleSignatureBlockProps) {
  return (
    <View style={{ width: '45%', marginTop: 40 }}>
      <Text style={styles.label}>{label}</Text>
      {name && <Text style={styles.name}>{name}</Text>}
      <View style={styles.signatureLine}>
        <Text style={styles.signatureLabel}>
          {name ? `(${name})` : '(                                        )'}
        </Text>
      </View>
    </View>
  )
}

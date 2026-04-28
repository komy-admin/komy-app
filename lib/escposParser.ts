/**
 * Parser ESC/POS pour le rendu visuel d'un ticket dans l'app admin.
 *
 * Decode un payload base64 (genere par EscposEncoderService cote backend)
 * en une liste de blocs prets a etre rendus. Les commandes ESC/POS
 * (init, charset, bold, alignement, double-size, cut) sont consommees
 * pour mettre a jour l'etat de mise en forme. Les bytes texte (ASCII et
 * CP858 pour les accents francais) sont convertis en Unicode pour
 * affichage.
 *
 * Ce parser n'est pas exhaustif — il couvre les commandes utilisees par
 * notre EscposEncoderService backend. C'est un debug viewer, pas un
 * emulateur d'imprimante complet.
 */

/** Mapping CP858 (>= 0x80) vers Unicode. Inverse de cp858_encoder cote backend. */
const CP858_TO_UNICODE: Record<number, string> = {
  0x80: 'Ç',
  0x81: 'ü',
  0x82: 'é',
  0x83: 'â',
  0x84: 'ä',
  0x85: 'à',
  0x86: 'å',
  0x87: 'ç',
  0x88: 'ê',
  0x89: 'ë',
  0x8a: 'è',
  0x8b: 'ï',
  0x8c: 'î',
  0x8d: 'ì',
  0x8e: 'Ä',
  0x8f: 'Å',
  0x90: 'É',
  0x91: 'æ',
  0x92: 'Æ',
  0x93: 'ô',
  0x94: 'ö',
  0x95: 'ò',
  0x96: 'û',
  0x97: 'ù',
  0x98: 'ÿ',
  0x99: 'Ö',
  0x9a: 'Ü',
  0x9c: '£',
  0x9d: 'Ø',
  0x9e: '¥',
  0xa4: 'ñ',
  0xa6: 'ª',
  0xa7: 'º',
  0xa8: '¿',
  0xab: '½',
  0xac: '¼',
  0xad: '¡',
  0xae: '«',
  0xaf: '»',
  0xb6: 'Â',
  0xb7: 'À',
  0xd2: 'Ê',
  0xd3: 'Ë',
  0xd4: 'È',
  0xd5: '€',
  0xd6: 'Î',
  0xd7: 'Ï',
  0xe2: 'Ô',
  0xe3: 'Ò',
  0xea: 'Û',
  0xeb: 'Ù',
  0xf1: '±',
  0xf4: '¶',
  0xf5: '§',
  0xf6: '÷',
  0xf8: '°',
  0xfa: '·',
}

export type EscposAlign = 'left' | 'center' | 'right'

export interface EscposBlock {
  /** Texte de la ligne, deja decode en Unicode. Vide si la ligne ne contient que du formatage. */
  text: string
  align: EscposAlign
  bold: boolean
  doubleSize: boolean
  /** Vrai si la ligne ne contient que des `-` (separateur visuel). */
  isSeparator: boolean
}

interface ParserState {
  align: EscposAlign
  bold: boolean
  doubleSize: boolean
}

/**
 * Decode une chaine base64 en Uint8Array, sans dependre de Buffer
 * (compatible Expo Go / browser).
 */
function decodeBase64(b64: string): Uint8Array {
  const binary = typeof atob === 'function'
    ? atob(b64)
    : globalThis.atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function isSeparatorLine(text: string): boolean {
  return text.length > 0 && /^-+$/.test(text.trimEnd())
}

/**
 * Parse un payload ESC/POS en blocs prets pour le rendu UI.
 */
export function parseEscPos(payloadBase64: string): EscposBlock[] {
  let bytes: Uint8Array
  try {
    bytes = decodeBase64(payloadBase64)
  } catch {
    return [
      {
        text: '[payload invalide ou non décodable]',
        align: 'left',
        bold: false,
        doubleSize: false,
        isSeparator: false,
      },
    ]
  }

  const blocks: EscposBlock[] = []
  const state: ParserState = {
    align: 'left',
    bold: false,
    doubleSize: false,
  }
  let buffer = ''

  const flushLine = () => {
    blocks.push({
      text: buffer,
      align: state.align,
      bold: state.bold,
      doubleSize: state.doubleSize,
      isSeparator: isSeparatorLine(buffer),
    })
    buffer = ''
  }

  let i = 0
  while (i < bytes.length) {
    const byte = bytes[i]

    if (byte === 0x0a) {
      flushLine()
      i += 1
      continue
    }

    if (byte === 0x1b) {
      const cmd = bytes[i + 1]

      if (cmd === 0x40) {
        // ESC @ : init — reset state
        state.align = 'left'
        state.bold = false
        state.doubleSize = false
        i += 2
        continue
      }
      if (cmd === 0x74) {
        // ESC t N : charset selection — on assume CP858 cote app
        i += 3
        continue
      }
      if (cmd === 0x45) {
        // ESC E N : bold
        state.bold = bytes[i + 2] === 0x01
        i += 3
        continue
      }
      if (cmd === 0x61) {
        // ESC a N : align
        const a = bytes[i + 2]
        state.align = a === 1 ? 'center' : a === 2 ? 'right' : 'left'
        i += 3
        continue
      }
      // commande inconnue : avance d'un byte
      i += 1
      continue
    }

    if (byte === 0x1d) {
      const cmd = bytes[i + 1]

      if (cmd === 0x21) {
        // GS ! N : taille
        state.doubleSize = bytes[i + 2] === 0x11
        i += 3
        continue
      }
      if (cmd === 0x56) {
        // GS V N (cut) : 3 ou 4 bytes selon variante
        const sub = bytes[i + 2]
        i += sub === 0x42 ? 4 : 3
        continue
      }
      i += 1
      continue
    }

    // Bytes texte
    if (byte >= 0x20 && byte < 0x80) {
      buffer += String.fromCharCode(byte)
    } else if (byte >= 0x80) {
      buffer += CP858_TO_UNICODE[byte] ?? '?'
    }
    // bytes < 0x20 (autres que LF) : ignores

    i += 1
  }

  if (buffer.length > 0) {
    flushLine()
  }

  return blocks
}

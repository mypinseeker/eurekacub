import { registerRenderer } from '../registry'
import PixelArt from './PixelArt'

registerRenderer({
  id: 'matrix',
  name: { zh: '像素矩阵', en: 'Pixel Matrix' },
  component: PixelArt,
  author: 'EurekaCub Core',
  version: '1.0.0',
})

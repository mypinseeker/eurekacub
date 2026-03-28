import { registerRenderer } from '../registry'
import MirrorCanvas from './MirrorCanvas'

registerRenderer({
  id: 'symmetry',
  name: { zh: '对称镜像画板', en: 'Mirror Canvas' },
  component: MirrorCanvas,
  author: 'EurekaCub Core',
  version: '1.0.0',
})

import { registerRenderer } from '../registry'
import Tangram from './Tangram'

registerRenderer({
  id: 'geometry',
  name: { zh: '七巧板', en: 'Tangram' },
  component: Tangram,
  author: 'EurekaCub Core',
  version: '1.0.0',
})

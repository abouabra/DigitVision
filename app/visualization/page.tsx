import React from 'react'
import Tsne3D from './tsne_3d'

const VisualizationPage = () => {
  return (
    <div className='flex' style={{ height: 'calc(100vh - 85px)' }}>
      <Tsne3D />
    </div>
  )
}

export default VisualizationPage
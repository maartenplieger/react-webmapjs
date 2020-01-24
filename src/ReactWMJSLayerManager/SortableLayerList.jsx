import React from 'react';
import ReactWMJSLayerRow from './LayerRow';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon } from 'react-fa';

const DragHandle = SortableHandle(() =>
  <span className={'SortableReactWMJSLayerDragHandle'}>
    <Icon className={'SortableReactWMJSLayerDragHandleIcon'} name='hand-grab-o' />
    <span className={'DragHandleTooltipText'}>
      Drag a layer up or down
    </span>
  </span>);

const SortableReactWMJSLayerRow = SortableElement(({ dispatch, activeMapPanel, layerManager, services, layerIndex }) => (
  <div className={'noselect SortableReactWMJSLayerRow'} >
    <DragHandle />
    <ReactWMJSLayerRow
      dispatch={dispatch}
      activeMapPanel={activeMapPanel}
      layerManager={layerManager}
      services={services}
      layerIndex={layerIndex}
    />
  </div>
));

export default SortableContainer(({ dispatch, activeMapPanelId, activeMapPanel, layerManager, services }) => {
  return (
    <div>
      {
        layerManager.layers.map((layer, layerIndex) => (<SortableReactWMJSLayerRow
          key={layerIndex}
          dispatch={dispatch}
          activeMapPanel={activeMapPanel}
          layerManager={layerManager}
          services={services}
          layerIndex={layerIndex}
          index={layerIndex}
        />)
        )
      }
    </div>
  );
});

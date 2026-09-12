type Point = { element: HTMLElement; id: string; x: number; y: number };

export function createTreeCamera(map: HTMLElement) {
  const viewport = map.querySelector<HTMLElement>('[data-map-viewport]')!;
  const world = map.querySelector<HTMLElement>('[data-map-world]')!;
  const svg = map.querySelector<SVGSVGElement>('.tree-connectors')!;
  const points: Point[] = [...map.querySelectorAll<HTMLElement>('[data-tree-point]')].map((element) => ({
    element,
    id: element.dataset.treePoint!,
    x: Number(element.dataset.treeX),
    y: Number(element.dataset.treeY),
  }));
  let zoom = 1;
  let frame = 0;
  let drag: { id: number; x: number; y: number; moved: boolean } | null = null;
  let suppressClick = false;

  let cameraX = 0;
  let cameraY = 0;
  let currentCameraZoom = 1;
  let targetCameraX = 0;
  let targetCameraY = 0;
  let targetCameraZoom = 1;
  let animFrame = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const isCompact = () => viewport.clientWidth < 860;
  const axisScale = () => isCompact() ? .58 : 1;
  const fittedScale = () => {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const horizontalRoom = width - (isCompact() ? 36 : 140);
    const verticalRoom = height - (isCompact() ? 120 : 190);
    const focusedBranch = map.classList.contains('has-selection') && !isCompact();
    return Math.max(.4, Math.min(horizontalRoom / (focusedBranch ? 1320 : 1650), verticalRoom / (focusedBranch ? 860 : 930), 1.08));
  };

  function tickAnim() {
    let moved = false;
    if (Math.abs(targetCameraX - cameraX) > 0.5) { cameraX += (targetCameraX - cameraX) * 0.12; moved = true; }
    if (Math.abs(targetCameraY - cameraY) > 0.5) { cameraY += (targetCameraY - cameraY) * 0.12; moved = true; }
    if (Math.abs(targetCameraZoom - currentCameraZoom) > 0.005) { currentCameraZoom += (targetCameraZoom - currentCameraZoom) * 0.12; moved = true; }
    if (moved) {
      render();
      animFrame = requestAnimationFrame(tickAnim);
    } else {
      animFrame = 0;
    }
  }

  function moveCamera() {
    if (reducedMotion.matches) {
      cameraX = targetCameraX;
      cameraY = targetCameraY;
      currentCameraZoom = targetCameraZoom;
      render();
      return;
    }
    if (!animFrame) tickAnim();
  }

  function renderNow() {
    frame = 0;
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    if (!width || !height) return;
    world.style.cssText = `width:${width}px;height:${height}px;transform:none`;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const compact = isCompact();
    const baseScale = fittedScale() * zoom * currentCameraZoom;
    const focusedBranch = map.classList.contains('has-selection');
    const centerX = width * .5;
    const centerY = compact ? height * .5 : height * (focusedBranch ? .58 : .72);
    const projected = new Map<string, { x: number; y: number; radius: number }>();
    const topicLabels: HTMLElement[] = [];

    for (const point of points) {
      // Pure 2D flat layout
      const x = centerX + cameraX + point.x * baseScale * axisScale();
      const y = centerY + cameraY + point.y * baseScale;
      const nodeScale = Math.max(.78, Math.min(1.08, .82 + baseScale * .16));
      const box = point.element.matches('.tree-root') ? 92 : point.element.matches('.tree-collection') ? 68 : 46;
      point.element.style.width = `${box}px`;
      point.element.style.height = `${box}px`;
      point.element.style.left = `${x - box / 2}px`;
      point.element.style.top = `${y - box / 2}px`;
      point.element.style.transform = `scale(${nodeScale})`;
      point.element.style.zIndex = point.element.matches('.tree-root') ? '4' : point.element.matches('.tree-collection') ? '3' : '2';
      point.element.style.opacity = point.element.hidden ? '0' : '1';
      projected.set(point.id, { x, y, radius: box * nodeScale * .5 });
      if (point.element.matches('.tree-topic') && !point.element.hidden) topicLabels.push(point.element);
    }

    const occupied = [...map.querySelectorAll<HTMLElement>('.tree-root .tree-label, .tree-collection:not([hidden]) .tree-label')].map((label) => label.getBoundingClientRect());
    topicLabels.forEach((element) => {
      const label = element.querySelector<HTMLElement>('.tree-label')!;
      if (!compact) {
        label.style.visibility = 'visible';
        return;
      }
      const bounds = label.getBoundingClientRect();
      const gap = 10;
      const overlaps = occupied.some((other) => bounds.left < other.right + gap && bounds.right + gap > other.left && bounds.top < other.bottom + gap && bounds.bottom + gap > other.top);
      label.style.visibility = overlaps ? 'hidden' : 'visible';
      if (!overlaps) occupied.push(bounds);
    });

    map.querySelectorAll<SVGLineElement>('[data-tree-line]').forEach((line) => {
      const source = projected.get(line.dataset.treeSource!);
      const target = projected.get(line.dataset.treeTarget!);
      if (!source || !target) return;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.hypot(dx, dy) || 1;
      const unitX = dx / distance;
      const unitY = dy / distance;
      line.setAttribute('x1', String(source.x + unitX * source.radius));
      line.setAttribute('y1', String(source.y + unitY * source.radius));
      line.setAttribute('x2', String(target.x - unitX * (target.radius + 7)));
      line.setAttribute('y2', String(target.y - unitY * (target.radius + 7)));
    });
  }

  const render = () => { if (!frame) frame = requestAnimationFrame(renderNow); };
  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('.map-empty')) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    viewport.setPointerCapture(event.pointerId);
    
    targetCameraX += dx;
    targetCameraY += dy;
    cameraX += dx;
    cameraY += dy;
    
    drag.x = event.clientX;
    drag.y = event.clientY;
    render();
  });
  const release = (event: PointerEvent) => {
    if (!drag || drag.id !== event.pointerId) return;
    suppressClick = drag.moved;
    drag = null;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    setTimeout(() => { suppressClick = false; }, 0);
  };
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);
  viewport.addEventListener('click', (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  viewport.addEventListener('keydown', (event) => {
    const keys: Record<string, [number, number]> = { ArrowLeft: [25, 0], ArrowRight: [-25, 0], ArrowUp: [0, 25], ArrowDown: [0, -25] };
    const delta = keys[event.key];
    if (!delta) return;
    event.preventDefault();
    targetCameraX += delta[0];
    targetCameraY += delta[1];
    moveCamera();
  });
  new ResizeObserver(render).observe(viewport);

  return {
    render,
    zoom(value: number) { zoom = value; render(); },
    reset() { zoom = 1; targetCameraX = 0; targetCameraY = 0; targetCameraZoom = 1; moveCamera(); render(); },
    focus(id: string | null) {
      if (!id) {
        targetCameraX = 0;
        targetCameraY = 0;
        targetCameraZoom = 1;
      } else {
        const pt = points.find(p => p.id === id);
        if (pt) {
          const compact = isCompact();
          const currentScale = fittedScale() * zoom;
          targetCameraZoom = compact ? .82 : 1;
          const collection = pt.element.dataset.collection;
          const branchPoint = collection ? points.find((point) => point.id === `collection-${collection}`) : null;
          const focusPoint = branchPoint || pt;
          targetCameraX = -focusPoint.x * currentScale * targetCameraZoom * axisScale();
          const desiredY = branchPoint ? viewport.clientHeight * .22 : pt.element.matches('.tree-collection') ? viewport.clientHeight * .38 : viewport.clientHeight * .46;
          const projectionCenterY = compact ? viewport.clientHeight * .5 : viewport.clientHeight * (map.classList.contains('has-selection') ? .58 : .72);
          targetCameraY = desiredY - projectionCenterY - focusPoint.y * currentScale * targetCameraZoom;
        }
      }
      moveCamera();
    }
  };
}

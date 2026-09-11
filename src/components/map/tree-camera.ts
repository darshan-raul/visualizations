type Point = { element: HTMLElement; id: string; x: number; y: number; z: number };

export function createTreeCamera(map: HTMLElement) {
  const viewport = map.querySelector<HTMLElement>('[data-map-viewport]')!;
  const world = map.querySelector<HTMLElement>('[data-map-world]')!;
  const svg = map.querySelector<SVGSVGElement>('.tree-connectors')!;
  const points: Point[] = [...map.querySelectorAll<HTMLElement>('[data-tree-point]')].map((element) => ({
    element,
    id: element.dataset.treePoint!,
    x: Number(element.dataset.treeX),
    y: Number(element.dataset.treeY),
    z: Number(element.dataset.treeZ),
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

  function renderNow() {
    frame = 0;
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    if (!width || !height) return;
    world.style.cssText = `width:${width}px;height:${height}px;transform:none`;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const compact = width < 700;
    const baseScale = Math.max(.42, Math.min((width - (compact ? 40 : 160)) / 1050, (height - (compact ? 300 : 230)) / 1000, 1.15)) * zoom * currentCameraZoom;
    const centerX = compact ? width * .34 : width * .45;
    const centerY = compact ? height * .54 : height * .5;
    const projected = new Map<string, { x: number; y: number; z: number }>();
    const topicLabels: { element: HTMLElement; z: number }[] = [];

    for (const point of points) {
      // Pure 2D flat layout
      const x = centerX + cameraX + point.x * baseScale * (compact ? .45 : 1);
      const y = centerY + cameraY + point.y * baseScale;
      // Use point.size mapping as the 2D node scale base since it's flat
      const nodeScale = Math.max(.7, Math.min(1.2, .75 + baseScale * .2));
      const box = point.element.matches('.tree-root') ? 92 : point.element.matches('.tree-collection') ? 70 : 46;
      point.element.style.width = `${box}px`;
      point.element.style.height = `${box}px`;
      point.element.style.left = `${x - box / 2}px`;
      point.element.style.top = `${y - box / 2}px`;
      point.element.style.transform = `scale(${nodeScale})`;
      point.element.style.zIndex = String(Math.round(point.z + 500));
      point.element.style.opacity = point.element.hidden ? '0' : '1';
      projected.set(point.id, { x, y, z: point.z });
      if (point.element.matches('.tree-topic') && !point.element.hidden) topicLabels.push({ element: point.element, z: point.z });
    }

    const occupied = [...map.querySelectorAll<HTMLElement>('.tree-root .tree-label, .tree-collection:not([hidden]) .tree-label')].map((label) => label.getBoundingClientRect());
    topicLabels.forEach(({ element }) => {
      const label = element.querySelector<HTMLElement>('.tree-label')!;
      const bounds = label.getBoundingClientRect();
      const gap = compact ? 10 : 6;
      const overlaps = occupied.some((other) => bounds.left < other.right + gap && bounds.right + gap > other.left && bounds.top < other.bottom + gap && bounds.bottom + gap > other.top);
      label.style.visibility = overlaps ? 'hidden' : 'visible';
      if (!overlaps) occupied.push(bounds);
    });

    map.querySelectorAll<SVGLineElement>('[data-tree-line]').forEach((line) => {
      const source = projected.get(line.dataset.treeSource!);
      const target = projected.get(line.dataset.treeTarget!);
      if (!source || !target) return;
      line.setAttribute('x1', String(source.x));
      line.setAttribute('y1', String(source.y));
      line.setAttribute('x2', String(target.x));
      line.setAttribute('y2', String(target.y));
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
    
    // Pan in 2D instead of rotating
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
    if (!animFrame) tickAnim();
  });
  new ResizeObserver(render).observe(viewport);

  return {
    render,
    zoom(value: number) { zoom = value; render(); },
    reset() { zoom = 1; targetCameraX = 0; targetCameraY = 0; targetCameraZoom = 1; if (!animFrame) tickAnim(); render(); },
    focus(id: string | null) {
      if (!id) {
        targetCameraX = 0;
        targetCameraY = 0;
        targetCameraZoom = 1;
      } else {
        const pt = points.find(p => p.id === id);
        if (pt) {
          const width = viewport.clientWidth;
          const compact = width < 700;
          const currentScale = Math.max(.42, Math.min((width - (compact ? 40 : 160)) / 1050, (viewport.clientHeight - (compact ? 300 : 230)) / 1000, 1.15)) * zoom;
          targetCameraZoom = compact ? 0.75 : 0.85;
          
          // Pure 2D offset calculation
          targetCameraX = - (pt.x + (compact ? 200 : 450)) * currentScale * targetCameraZoom * (compact ? .45 : 1);
          targetCameraY = - pt.y * currentScale * targetCameraZoom;
        }
      }
      if (!animFrame) tickAnim();
    }
  };
}

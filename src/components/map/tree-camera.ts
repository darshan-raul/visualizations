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
  let yaw = 0;
  let pitch = 0;
  let zoom = 1;
  let frame = 0;
  let drag: { id: number; x: number; y: number; moved: boolean } | null = null;
  let suppressClick = false;

  function renderNow() {
    frame = 0;
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    if (!width || !height) return;
    world.style.cssText = `width:${width}px;height:${height}px;transform:none`;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const compact = width < 700;
    const baseScale = Math.max(.42, Math.min((width - (compact ? 40 : 160)) / 1050, (height - (compact ? 300 : 230)) / 1000, 1.15)) * zoom;
    const centerX = compact ? width * .34 : width * .45;
    const centerY = compact ? height * .54 : height * .5;
    const projected = new Map<string, { x: number; y: number; z: number }>();
    const topicLabels: { element: HTMLElement; z: number }[] = [];

    for (const point of points) {
      const x1 = point.x * Math.cos(yaw) + point.z * Math.sin(yaw);
      const z1 = point.z * Math.cos(yaw) - point.x * Math.sin(yaw);
      const y1 = point.y * Math.cos(pitch) - z1 * Math.sin(pitch);
      const z2 = point.y * Math.sin(pitch) + z1 * Math.cos(pitch);
      const perspective = 1150 / (1150 - z2);
      const x = centerX + x1 * baseScale * perspective * (compact ? .45 : 1);
      const y = centerY + y1 * baseScale * perspective;
      const nodeScale = Math.max(.68, Math.min(1.22, perspective * (.83 + baseScale * .18)));
      const box = point.element.matches('.tree-root') ? 92 : point.element.matches('.tree-collection') ? 70 : 46;
      point.element.style.width = `${box}px`;
      point.element.style.height = `${box}px`;
      point.element.style.left = `${x - box / 2}px`;
      point.element.style.top = `${y - box / 2}px`;
      point.element.style.transform = `scale(${nodeScale})`;
      point.element.style.zIndex = String(Math.round(z2 + 500));
      point.element.style.opacity = point.element.hidden ? '0' : String(.64 + (z2 + 420) / 1900);
      projected.set(point.id, { x, y, z: z2 });
      if (point.element.matches('.tree-topic') && !point.element.hidden) topicLabels.push({ element: point.element, z: z2 });
    }

    const occupied = [...map.querySelectorAll<HTMLElement>('.tree-root .tree-label, .tree-collection:not([hidden]) .tree-label')].map((label) => label.getBoundingClientRect());
    topicLabels.sort((a, b) => b.z - a.z).forEach(({ element }) => {
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
    yaw += dx * .0055;
    pitch = Math.max(-1.05, Math.min(1.05, pitch + dy * .0055));
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
    const keys: Record<string, [number, number]> = { ArrowLeft: [-.13, 0], ArrowRight: [.13, 0], ArrowUp: [0, -.13], ArrowDown: [0, .13] };
    const delta = keys[event.key];
    if (!delta) return;
    event.preventDefault();
    yaw += delta[0];
    pitch = Math.max(-1.05, Math.min(1.05, pitch + delta[1]));
    render();
  });
  new ResizeObserver(render).observe(viewport);

  return {
    render,
    zoom(value: number) { zoom = value; render(); },
    reset() { yaw = 0; pitch = 0; zoom = 1; render(); },
  };
}

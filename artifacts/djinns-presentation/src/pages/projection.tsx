import { ProjectionScene } from '@/components/projection-scene';
import { useProjectionState } from '@/lib/projection-state';

export default function Projection() {
  const { state } = useProjectionState();
  return <ProjectionScene state={state} mode="screen" />;
}

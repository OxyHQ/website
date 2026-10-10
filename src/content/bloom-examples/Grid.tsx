import { Row, Col } from '@oxy.so/bloom/grid';

export default function GridExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Row>
        <Col>
          <div className="rounded-xl bg-secondary p-6 text-secondary-foreground">First column</div>
        </Col>
        <Col>
          <div className="rounded-xl bg-secondary p-6 text-secondary-foreground">Second column</div>
        </Col>
      </Row>
    </div>
  );
}

export class P5Engine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.spec = null;
    this.p5Instance = null;
  }

  loadSpec(sceneSpec) {
    this.spec = sceneSpec;
    this.render();
  }

  render() {
    if (this.p5Instance) {
      this.p5Instance.remove();
    }

    const sketch = (p) => {
      let time = 0;
      let dynamicPositions = {}; // Stores animated positions of all entities

      p.setup = () => {
        const { width, height } = this.spec.canvas;
        let canvas = p.createCanvas(width, height);
        canvas.parent(this.container);
      };

      p.draw = () => {
        time = p.frameCount;
        p.background(this.spec.canvas.background);

        if (!this.spec.entities) return;

        // Pass 1: Calc animations / dynamic properties
        this.spec.entities.forEach(entity => {
          let pos = { x: entity.position?.x || p.width/2, y: entity.position?.y || p.height/2 };
          let size = { w: entity.size?.w || 40, h: entity.size?.h || 40 };
          
          if (entity.behaviors) {
            entity.behaviors.forEach(b => {
              if (b.type === 'oscillate') {
                const prop = b.property || 'position.y';
                if (prop === 'position.y') pos.y += p.sin(time * (b.speed || 0.05)) * (b.amplitude || 20);
                if (prop === 'position.x') pos.x += p.cos(time * (b.speed || 0.05)) * (b.amplitude || 20);
              }
              if (b.type === 'bounce') {
                pos.y += p.abs(p.sin(time * (b.speed || 0.05))) * (b.amplitude || 50) * -1;
              }
              if (b.type === 'pulse') {
                const variance = p.sin(time * (b.frequency || 0.05)) * (b.amplitude || 10);
                size.w += variance;
                size.h += variance;
              }
            });
          }
          
          dynamicPositions[entity.id] = { pos, size };
        });

        // Pass 2: Draw connections (lines) first so they are underneath
        this.spec.entities.filter(e => e.type === 'line').forEach(entity => {
          this.drawEntity(p, entity, dynamicPositions);
        });

        // Pass 3: Draw shapes
        this.spec.entities.filter(e => e.type !== 'line').forEach(entity => {
          this.drawEntity(p, entity, dynamicPositions);
        });
      };
    };

    // Instantiate p5 in instance mode using global window.p5 loaded via CDN
    this.p5Instance = new window.p5(sketch);
  }

  drawEntity(p, entity, dynamicState) {
    p.push(); // Save drawing context
    
    // Apply styling block
    if (entity.style) {
      if (entity.style.fill) p.fill(entity.style.fill);
      else p.noFill();
      
      if (entity.style.stroke) p.stroke(entity.style.stroke);
      else p.noStroke();
      
      if (entity.style.strokeWidth) p.strokeWeight(entity.style.strokeWidth);
      
      if (entity.style.dashed) {
        p.drawingContext.setLineDash([5, 10]);
      } else {
        p.drawingContext.setLineDash([]);
      }
    } else {
      p.noStroke();
      p.fill(255);
    }

    const state = dynamicState[entity.id] || { pos: {x:0, y:0}, size: {w:0, h:0} };
    const { pos, size } = state;

    // Draw primitives
    if (entity.type === 'rectangle') {
      p.rectMode(p.CENTER);
      p.rect(pos.x, pos.y, size.w, size.h, 6); // slight border-radius
      
      if (entity.text) this.drawText(p, pos, entity.text);
    } 
    else if (entity.type === 'circle') {
      p.circle(pos.x, pos.y, size.w);
      
      if (entity.text) this.drawText(p, pos, entity.text);
    }
    else if (entity.type === 'line') {
      const fromState = dynamicState[entity.from];
      const toState = dynamicState[entity.to];
      if (fromState && toState) {
        p.line(fromState.pos.x, fromState.pos.y, toState.pos.x, toState.pos.y);
        p.drawingContext.setLineDash([]); // Reset line dash for particles
        
        // Handle flow_particles behavior
        const flow = entity.behaviors?.find(b => b.type === 'flow_particles');
        if (flow) {
          p.push();
          p.noStroke();
          p.fill(flow.color || '#3b82f6');
          // t interpolates along the line repeatedly
          let t = (p.frameCount * (flow.speed || 1)) % 100 / 100;
          let px = p.lerp(fromState.pos.x, toState.pos.x, t);
          let py = p.lerp(fromState.pos.y, toState.pos.y, t);
          p.circle(px, py, 8); 
          p.pop();
        }
      }
    }
    
    p.pop(); // Restore drawing context
  }

  drawText(p, pos, textObj) {
    p.push();
    p.noStroke();
    p.fill(textObj.fill || '#ffffff');
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(textObj.size || 14);
    p.text(textObj.content, pos.x, pos.y);
    p.pop();
  }
}

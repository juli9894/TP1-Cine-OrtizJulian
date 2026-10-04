import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormularioProducto } from './formulario-producto';

describe('FormularioProducto', () => {
  let component: FormularioProducto;
  let fixture: ComponentFixture<FormularioProducto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioProducto],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioProducto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

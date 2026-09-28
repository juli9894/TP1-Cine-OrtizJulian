import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormularioSala } from './formulario-sala';

describe('FormularioSala', () => {
  let component: FormularioSala;
  let fixture: ComponentFixture<FormularioSala>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioSala],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioSala);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

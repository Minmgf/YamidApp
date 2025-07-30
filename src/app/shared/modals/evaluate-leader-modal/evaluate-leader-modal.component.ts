import { Component, OnInit, Input } from '@angular/core';
import { ModalController, IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { EvaluationService, EvaluationRequest } from '../../../services/evaluation.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-evaluate-leader-modal',
  templateUrl: './evaluate-leader-modal.component.html',
  styleUrls: ['./evaluate-leader-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class EvaluateLeaderModalComponent implements OnInit {
  @Input() leaderName: string = '';
  @Input() evaluadoId: number = 0;
  @Input() evaluatorId: number = 0;
  @Input() evaluatorName: string = '';

  rating: number = 0;
  isSubmitting: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private evaluationService: EvaluationService,
    private authService: AuthService
  ) {}

  ngOnInit() {}

  /**
   * Cierra el modal sin guardar
   */
  closeModal() {
    this.modalCtrl.dismiss();
  }

  /**
   * Establece el rating seleccionado
   */
  setRating(stars: number): void {
    if (!this.isSubmitting) {
      this.rating = stars;
    }
  }

  /**
   * Envía la evaluación al servidor
   */
  async enviarCalificacion(): Promise<void> {
    if (this.rating === 0 || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    try {
      const currentUser = this.authService.getCurrentUser();

      if (!currentUser) {
        await this.showAlert('Error', 'No se pudo obtener la información del usuario actual.');
        return;
      }

      const evaluationData: EvaluationRequest = {
        evaluado_id: this.evaluadoId,
        evaluador_id: Number(currentUser.id),
        calificacion: this.rating,
        comentario: ""
      };

      console.log('Enviando evaluación con estructura:', evaluationData);

      const response = await this.evaluationService.submitEvaluation(evaluationData).toPromise();

      if (response?.success) {
        await this.showAlert(
          'Evaluación Enviada',
          `Has calificado a ${this.leaderName} con ${this.rating} estrella${this.rating !== 1 ? 's' : ''}.`
        );

        // Cerrar el modal con éxito
        this.modalCtrl.dismiss({
          success: true,
          rating: this.rating
        });
      } else {
        await this.showAlert('Error', response?.message || 'No se pudo enviar la evaluación. Intenta nuevamente.');
      }

    } catch (error: any) {
      let errorMessage = 'Ocurrió un error inesperado. Intenta nuevamente.';

      if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      await this.showAlert('Error', errorMessage);
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Muestra una alerta
   */
  private async showAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Genera array para mostrar las estrellas
   */
  getStarsArray(): number[] {
    return [1, 2, 3, 4, 5];
  }
}

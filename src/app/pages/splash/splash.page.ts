import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: false
})
export class SplashPage implements OnInit, AfterViewInit {
  @ViewChild('splashVideo', { static: false }) splashVideo!: ElementRef<HTMLVideoElement>;

  constructor(private router: Router) {}

  ngOnInit() {
    // Navegar después de 3 segundos
    setTimeout(() => {
      this.router.navigateByUrl('/login');
    }, 3000);
  }

  ngAfterViewInit() {
    // Optimizar video para móvil
    if (this.splashVideo?.nativeElement) {
      const video = this.splashVideo.nativeElement;

      // Configuraciones para móvil
      video.muted = true; // Necesario para autoplay en mobile
      video.playsInline = true; // Evita pantalla completa en iOS
      video.controls = false; // Sin controles

      // Intentar reproducir
      video.play().catch(error => {
        console.log('Video autoplay failed:', error);
        // Si falla el video, continuar con fallback
      });

      // Optimización para diferentes orientaciones móviles
      video.style.objectFit = 'cover';
    }
  }
}


import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface PredictionResponse {
  status: string;
  celebrity?: string;
  message?: string;
  detected_faces?: number;
  annotated_image?: string;
  image_width?: number;
  image_height?: number;
}

interface GalleryCelebrity {
  name: string;
  image: string;
  imageCount: number;
  category: string;
}

interface HistoryItem {
  id: string;
  celebrity: string;
  fileName: string;
  detectedFaces: number;
  predictionTime: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8000/predict';
  private readonly historyStorageKey = 'facespotlight_prediction_history';
  private readonly themeStorageKey = 'facespotlight_dark_mode';

  selectedFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);
  annotatedImage = signal<string | null>(null);
  prediction = signal<PredictionResponse | null>(null);
  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);
  isDragging = signal(false);
  isDarkMode = signal(false);
  activeSection = signal('home');
  historySearch = signal('');
  historyFilter = signal('all');
  predictionHistory = signal<HistoryItem[]>([]);
  selectedGalleryCelebrity = signal<GalleryCelebrity | null>(null);

  readonly maxFileSize = 10 * 1024 * 1024;

  readonly celebrityNames = [
    'Aamir', 'Ajay', 'Akshay', 'Alia', 'Amitabh',
    'Deepika', 'Disha', 'Farhan', 'Ileana'
  ];

  readonly celebrityGallery: GalleryCelebrity[] = [
    {
      name: 'Aamir',
      image: 'assets/gallery/Aamir.jpg',
      imageCount: 50,
      category: 'Actor'
    },
    {
      name: 'Ajay',
      image: 'assets/gallery/Ajay.jpg',
      imageCount: 45,
      category: 'Actor'
    },
    {
      name: 'Akshay',
      image: 'assets/gallery/Akshay.jpeg',
      imageCount: 47,
      category: 'Actor'
    },
    {
      name: 'Alia',
      image: 'assets/gallery/Alia.jpg',
      imageCount: 49,
      category: 'Actor'
    },
    {
      name: 'Amitabh',
      image: 'assets/gallery/Amitabh.jpeg',
      imageCount: 40,
      category: 'Actor'
    },
    {
      name: 'Deepika',
      image: 'assets/gallery/Deepika.jpg',
      imageCount: 50,
      category: 'Actor'
    },
    {
      name: 'Disha',
      image: 'assets/gallery/Disha.jpg',
      imageCount: 50,
      category: 'Actor'
    },
    {
      name: 'Farhan',
      image: 'assets/gallery/Farhan.jpg',
      imageCount: 45,
      category: 'Actor'
    },
    {
      name: 'Ileana',
      image: 'assets/gallery/Ileana.jpg',
      imageCount: 48,
      category: 'Actor'
    }
  ];

  readonly datasetDistribution = [
    { name: 'Aamir', count: 50 },
    { name: 'Ajay', count: 45 },
    { name: 'Akshay', count: 47 },
    { name: 'Alia', count: 49 },
    { name: 'Amitabh', count: 40 },
    { name: 'Deepika', count: 50 },
    { name: 'Disha', count: 50 },
    { name: 'Farhan', count: 45 },
    { name: 'Ileana', count: 48 }
  ];

  readonly classificationReport = [
    { name: 'Aamir', precision: '0.84', recall: '0.82', f1: '0.83', support: 50 },
    { name: 'Ajay', precision: '0.77', recall: '0.82', f1: '0.80', support: 45 },
    { name: 'Akshay', precision: '0.79', recall: '0.89', f1: '0.84', support: 47 },
    { name: 'Alia', precision: '0.90', recall: '0.88', f1: '0.89', support: 49 },
    { name: 'Amitabh', precision: '0.79', recall: '0.85', f1: '0.82', support: 40 },
    { name: 'Deepika', precision: '0.96', recall: '0.92', f1: '0.94', support: 50 },
    { name: 'Disha', precision: '0.79', recall: '0.76', f1: '0.78', support: 50 },
    { name: 'Farhan', precision: '0.93', recall: '0.82', f1: '0.87', support: 45 },
    { name: 'Ileana', precision: '0.77', recall: '0.75', f1: '0.76', support: 48 }
  ];

  readonly confusionMatrix = [
    [41, 5, 1, 0, 1, 0, 0, 2, 0],
    [2, 37, 3, 0, 2, 0, 1, 0, 0],
    [0, 3, 42, 0, 2, 0, 0, 0, 0],
    [0, 0, 1, 43, 0, 1, 1, 0, 3],
    [2, 1, 2, 0, 34, 0, 0, 1, 0],
    [1, 0, 0, 2, 1, 46, 0, 0, 0],
    [0, 1, 1, 2, 1, 0, 38, 0, 7],
    [2, 1, 2, 0, 2, 0, 0, 37, 1],
    [1, 0, 1, 1, 0, 1, 8, 0, 36]
  ];

  filteredHistory = computed(() => {
    const query = this.historySearch().trim().toLowerCase();
    const filter = this.historyFilter();

    return this.predictionHistory().filter(item => {
      const matchesQuery =
        !query ||
        item.celebrity.toLowerCase().includes(query) ||
        item.fileName.toLowerCase().includes(query);

      const matchesFilter =
        filter === 'all' || item.celebrity === filter;

      return matchesQuery && matchesFilter;
    });
  });

  totalPredictions = computed(() => this.predictionHistory().length);

  mostPredictedCelebrity = computed(() => {
    const counts = this.predictionHistory().reduce((acc, item) => {
      acc[item.celebrity] = (acc[item.celebrity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])[0];

    return top ? top[0] : '—';
  });

  predictionDistribution = computed(() => {
    const counts = this.predictionHistory().reduce((acc, item) => {
      acc[item.celebrity] = (acc[item.celebrity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const max = Math.max(1, ...Object.values(counts));

    return this.celebrityNames.map(name => ({
      name,
      count: counts[name] || 0,
      width: `${((counts[name] || 0) / max) * 100}%`
    }));
  });

  constructor() {
    this.loadHistory();
    this.loadTheme();
  }

  private loadHistory(): void {
    try {
      const saved = localStorage.getItem(this.historyStorageKey);

      if (saved) {
        const parsed = JSON.parse(saved) as HistoryItem[];
        this.predictionHistory.set(
          Array.isArray(parsed) ? parsed.slice(0, 50) : []
        );
      }
    } catch {
      this.predictionHistory.set([]);
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(
        this.historyStorageKey,
        JSON.stringify(this.predictionHistory().slice(0, 50))
      );
    } catch {
      this.errorMessage.set(
        'Browser storage is full. Older history may not be saved.'
      );
    }
  }

  private loadTheme(): void {
    this.isDarkMode.set(
      localStorage.getItem(this.themeStorageKey) === 'true'
    );
  }

  toggleTheme(): void {
    this.isDarkMode.update(value => !value);
    localStorage.setItem(
      this.themeStorageKey,
      String(this.isDarkMode())
    );
  }

  setActiveSection(section: string): void {
    this.activeSection.set(section);
    document.getElementById(section)?.scrollIntoView({
      behavior: 'smooth'
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.acceptFile(file);
    }

    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);

    const file = event.dataTransfer?.files?.[0];

    if (file) {
      this.acceptFile(file);
    }
  }

  private acceptFile(file: File): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.prediction.set(null);
    this.annotatedImage.set(null);

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.errorMessage.set(
        'Please upload a JPG, PNG or WEBP image.'
      );
      return;
    }

    if (file.size > this.maxFileSize) {
      this.errorMessage.set(
        'Image is too large. Please choose an image under 10 MB.'
      );
      return;
    }

    const previous = this.imagePreview();

    if (previous) {
      URL.revokeObjectURL(previous);
    }

    this.selectedFile.set(file);
    this.imagePreview.set(URL.createObjectURL(file));
  }

  predictCelebrity(): void {
    const file = this.selectedFile();

    if (!file) {
      this.errorMessage.set('Please upload an image first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.prediction.set(null);
    this.annotatedImage.set(null);

    this.http.post<PredictionResponse>(
      this.apiUrl,
      formData
    ).subscribe({
      next: response => {
        this.isLoading.set(false);

        if (
          response.status === 'success' &&
          response.celebrity
        ) {
          this.prediction.set(response);

          if (response.annotated_image) {
            this.annotatedImage.set(
              `data:image/jpeg;base64,${response.annotated_image}`
            );
          }

          const item: HistoryItem = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            celebrity: response.celebrity,
            fileName: file.name,
            detectedFaces: response.detected_faces ?? 0,
            predictionTime: new Date().toISOString()
          };

          this.predictionHistory.update(
            items => [item, ...items].slice(0, 50)
          );

          this.saveHistory();
          this.successMessage.set(
            'Prediction completed successfully.'
          );
        } else {
          this.errorMessage.set(
            response.message || 'Unable to recognize this image.'
          );
        }
      },
      error: error => {
        this.isLoading.set(false);

        const detail = error?.error?.detail;

        this.errorMessage.set(
          typeof detail === 'string'
            ? detail
            : 'Unable to connect to FastAPI. Check that the backend server is running.'
        );
      }
    });
  }

  resetSelection(): void {
    const previous = this.imagePreview();

    if (previous) {
      URL.revokeObjectURL(previous);
    }

    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.annotatedImage.set(null);
    this.prediction.set(null);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  openGalleryPreview(person: GalleryCelebrity): void {
    this.selectedGalleryCelebrity.set(person);
  }

  closeGalleryPreview(): void {
    this.selectedGalleryCelebrity.set(null);
  }

  deleteHistoryItem(id: string): void {
    this.predictionHistory.update(
      items => items.filter(item => item.id !== id)
    );

    this.saveHistory();
  }

  clearHistory(): void {
    if (!this.predictionHistory().length) {
      return;
    }

    if (confirm('Clear all saved prediction history?')) {
      this.predictionHistory.set([]);
      this.saveHistory();
    }
  }

  exportHistory(): void {
    const rows = this.predictionHistory();

    if (!rows.length) {
      return;
    }

    const header = [
      'Celebrity',
      'File name',
      'Detected regions',
      'Prediction time'
    ];

    const values = rows.map(item => [
      item.celebrity,
      item.fileName,
      String(item.detectedFaces),
      new Date(item.predictionTime).toLocaleString()
    ]);

    const csv = [header, ...values]
      .map(row =>
        row.map(value =>
          `"${String(value).replace(/"/g, '""')}"`
        ).join(',')
      )
      .join('\n');

    const blob = new Blob(
      [csv],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'facespotlight-prediction-history.csv';
    link.click();

    URL.revokeObjectURL(url);
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }

  getBarWidth(count: number): string {
    return `${(count / 50) * 100}%`;
  }

  getHeatStyle(value: number): string {
    const alpha = 0.08 + (value / 50) * 0.55;
    return `rgba(98, 84, 220, ${alpha})`;
  }
}

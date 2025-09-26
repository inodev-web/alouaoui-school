describe('Chapters Learning E2E Tests', () => {
  let authToken;

  beforeEach(() => {
    // Intercepter les appels API des chapitres
    cy.intercept('GET', '**/api/chapters', { fixture: 'chapters.json' }).as('getChapters');
    cy.intercept('GET', '**/api/chapters/1', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          title: "Les nombres complexes",
          description: "Introduction aux nombres complexes, forme algébrique et géométrique",
          video_url: "/videos/chapitre-1-complexes.mp4",
          pdf_url: "/pdfs/chapitre-1-complexes.pdf",
          exercises: [],
          progress: 100,
          can_access: true
        }
      }
    }).as('getChapter1');
    cy.intercept('POST', '**/api/chapters/*/progress', {
      statusCode: 200,
      body: {
        success: true,
        data: { progress: 100 }
      }
    }).as('updateProgress');
    cy.intercept('GET', '**/api/chapters/*/exercises', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          exercises: [
            {
              id: 1,
              question: "Calculez (3+2i) + (1-4i)",
              type: "multiple_choice",
              options: ["4-2i", "4+2i", "2-2i", "2+6i"],
              correct_answer: "4-2i"
            }
          ]
        }
      }
    }).as('getExercises');
  });

  describe('Navigation des chapitres (Étudiant)', () => {
    beforeEach(() => {
      cy.loginAsStudent();
    });

    it('devrait afficher la liste complète des chapitres', () => {
      cy.visit('/student/chapters');
      
      cy.wait('@getChapters');

      // Vérifier le header de la page
      cy.contains('Mes Chapitres').should('be.visible');
      cy.get('[data-testid="chapters-summary"]').should('be.visible');

      // Vérifier le résumé des statistiques
      cy.get('[data-testid="total-chapters"]').should('contain', '6');
      cy.get('[data-testid="completed-chapters"]').should('contain', '1');
      cy.get('[data-testid="overall-progress"]').should('contain', '28%');

      // Vérifier la barre de progression globale
      cy.get('[data-testid="overall-progress-bar"]')
        .should('be.visible')
        .and('have.attr', 'style')
        .and('include', 'width: 28%');

      // Vérifier l'affichage des chapitres
      cy.get('[data-testid="chapter-card"]').should('have.length', 6);
      
      // Vérifier le premier chapitre (complété)
      cy.get('[data-testid="chapter-1"]').within(() => {
        cy.contains('Les nombres complexes').should('be.visible');
        cy.get('[data-testid="chapter-progress"]').should('contain', '100%');
        cy.get('[data-testid="completion-badge"]').should('be.visible');
        cy.get('[data-testid="average-score"]').should('contain', '17.5');
      });

      // Vérifier un chapitre en cours
      cy.get('[data-testid="chapter-2"]').within(() => {
        cy.contains('Fonctions logarithmes').should('be.visible');
        cy.get('[data-testid="chapter-progress"]').should('contain', '85%');
        cy.get('[data-testid="difficulty-badge"]').should('contain', 'Avancé');
      });

      // Vérifier un chapitre verrouillé
      cy.get('[data-testid="chapter-5"]').within(() => {
        cy.contains('Probabilités').should('be.visible');
        cy.get('[data-testid="locked-icon"]').should('be.visible');
        cy.get('[data-testid="unlock-message"]').should('contain', 'Complétez le chapitre 4');
      });
    });

    it('devrait permettre de filtrer les chapitres par difficulté', () => {
      cy.visit('/student/chapters');
      cy.wait('@getChapters');

      // Filtrer par difficulté intermédiaire
      cy.get('[data-testid="difficulty-filter"]').select('intermediate');
      cy.get('[data-testid="chapter-card"]').should('have.length', 3);
      cy.get('[data-testid="chapter-card"]').each(($card) => {
        cy.wrap($card).find('[data-testid="difficulty-badge"]').should('contain', 'Intermédiaire');
      });

      // Filtrer par difficulté avancée
      cy.get('[data-testid="difficulty-filter"]').select('advanced');
      cy.get('[data-testid="chapter-card"]').should('have.length', 3);
      cy.get('[data-testid="chapter-card"]').each(($card) => {
        cy.wrap($card).find('[data-testid="difficulty-badge"]').should('contain', 'Avancé');
      });

      // Retour à tous
      cy.get('[data-testid="difficulty-filter"]').select('all');
      cy.get('[data-testid="chapter-card"]').should('have.length', 6);
    });

    it('devrait permettre de filtrer par statut de progression', () => {
      cy.visit('/student/chapters');
      cy.wait('@getChapters');

      // Filtrer les chapitres complétés
      cy.get('[data-testid="status-filter"]').select('completed');
      cy.get('[data-testid="chapter-card"]').should('have.length', 1);
      cy.get('[data-testid="chapter-1"]').should('be.visible');

      // Filtrer les chapitres en cours
      cy.get('[data-testid="status-filter"]').select('in_progress');
      cy.get('[data-testid="chapter-card"]').should('have.length', 3);

      // Filtrer les chapitres non commencés
      cy.get('[data-testid="status-filter"]').select('not_started');
      cy.get('[data-testid="chapter-card"]').should('have.length', 2);
    });

    it('devrait afficher la recommandation du prochain chapitre', () => {
      cy.visit('/student/chapters');
      cy.wait('@getChapters');

      // Vérifier la section de recommandation
      cy.get('[data-testid="next-recommendation"]').should('be.visible');
      cy.get('[data-testid="recommended-chapter"]').within(() => {
        cy.contains('Suites numériques').should('be.visible');
        cy.contains('Chapitre gratuit recommandé').should('be.visible');
        cy.get('[data-testid="start-recommended-btn"]').should('be.visible');
      });

      // Cliquer sur la recommandation
      cy.get('[data-testid="start-recommended-btn"]').click();
      cy.url().should('include', '/student/chapters/3');
    });
  });

  describe('Consultation d\'un chapitre', () => {
    beforeEach(() => {
      cy.loginAsStudent();
    });

    it('devrait permettre d\'accéder à un chapitre disponible', () => {
      cy.visit('/student/chapters/1');
      
      cy.wait('@getChapter1');

      // Vérifier les informations du chapitre
      cy.contains('Les nombres complexes').should('be.visible');
      cy.get('[data-testid="chapter-description"]').should('be.visible');
      cy.get('[data-testid="chapter-duration"]').should('contain', '45 min');
      cy.get('[data-testid="chapter-difficulty"]').should('contain', 'Intermédiaire');

      // Vérifier les éléments de navigation
      cy.get('[data-testid="video-tab"]').should('be.visible');
      cy.get('[data-testid="pdf-tab"]').should('be.visible');
      cy.get('[data-testid="exercises-tab"]').should('be.visible');

      // Vérifier la progression
      cy.get('[data-testid="chapter-progress-detail"]').should('contain', '100%');
      cy.get('[data-testid="exercises-progress"]').should('contain', '12/12');

      // Vérifier les topics/sujets couverts
      cy.get('[data-testid="chapter-topics"]').within(() => {
        cy.contains('Forme algébrique').should('be.visible');
        cy.contains('Forme trigonométrique').should('be.visible');
        cy.contains('Opérations').should('be.visible');
        cy.contains('Représentation géométrique').should('be.visible');
      });
    });

    it('devrait permettre de regarder la vidéo du chapitre', () => {
      cy.visit('/student/chapters/1');
      cy.wait('@getChapter1');

      // Onglet vidéo activé par défaut
      cy.get('[data-testid="video-tab"]').should('have.class', 'active');
      
      // Vérifier la présence du lecteur vidéo
      cy.get('[data-testid="video-player"]').should('be.visible');
      cy.get('[data-testid="video-player"]')
        .should('have.attr', 'src')
        .and('include', 'chapitre-1-complexes.mp4');

      // Vérifier les contrôles vidéo
      cy.get('[data-testid="play-pause-btn"]').should('be.visible');
      cy.get('[data-testid="video-progress"]').should('be.visible');
      cy.get('[data-testid="volume-control"]').should('be.visible');
      cy.get('[data-testid="fullscreen-btn"]').should('be.visible');

      // Vérifier les chapitres/timestamps de la vidéo
      cy.get('[data-testid="video-chapters"]').should('be.visible');
      cy.get('[data-testid="video-chapter-item"]').should('have.length.at.least', 1);
    });

    it('devrait permettre de consulter le PDF du chapitre', () => {
      cy.visit('/student/chapters/1');
      cy.wait('@getChapter1');

      // Cliquer sur l'onglet PDF
      cy.get('[data-testid="pdf-tab"]').click();

      // Vérifier l'affichage du PDF
      cy.get('[data-testid="pdf-viewer"]').should('be.visible');
      cy.get('[data-testid="pdf-download-btn"]').should('be.visible');
      cy.get('[data-testid="pdf-print-btn"]').should('be.visible');

      // Vérifier les contrôles de navigation PDF
      cy.get('[data-testid="pdf-page-prev"]').should('be.visible');
      cy.get('[data-testid="pdf-page-next"]').should('be.visible');
      cy.get('[data-testid="pdf-page-info"]').should('be.visible');
      cy.get('[data-testid="pdf-zoom-in"]').should('be.visible');
      cy.get('[data-testid="pdf-zoom-out"]').should('be.visible');
    });

    it('devrait permettre d\'accéder aux exercices du chapitre', () => {
      cy.visit('/student/chapters/1');
      cy.wait('@getChapter1');

      // Cliquer sur l'onglet exercices
      cy.get('[data-testid="exercises-tab"]').click();

      cy.wait('@getExercises');

      // Vérifier l'affichage des exercices
      cy.get('[data-testid="exercises-list"]').should('be.visible');
      cy.get('[data-testid="exercises-summary"]').within(() => {
        cy.contains('12 exercices').should('be.visible');
        cy.contains('12 complétés').should('be.visible');
        cy.contains('Score moyen: 17.5/20').should('be.visible');
      });

      // Vérifier qu'on peut démarrer un exercice
      cy.get('[data-testid="start-exercise-btn"]').first().should('be.visible');
    });

    it('devrait empêcher l\'accès à un chapitre verrouillé', () => {
      cy.visit('/student/chapters/5');

      // Vérifier la page de restriction
      cy.contains('Chapitre verrouillé').should('be.visible');
      cy.contains('Complétez le chapitre 4 pour débloquer ce chapitre').should('be.visible');
      cy.get('[data-testid="go-to-chapter-4-btn"]').should('be.visible');

      // Vérifier qu'on ne peut pas accéder au contenu
      cy.get('[data-testid="video-player"]').should('not.exist');
      cy.get('[data-testid="pdf-viewer"]').should('not.exist');
    });
  });

  describe('Progression et suivi', () => {
    beforeEach(() => {
      cy.loginAsStudent();
    });

    it('devrait mettre à jour la progression lors du visionnage', () => {
      cy.visit('/student/chapters/2');
      
      // Simuler le visionnage de la vidéo
      cy.get('[data-testid="video-player"]').should('be.visible');
      
      // Simuler la progression à 90% de la vidéo
      cy.get('[data-testid="video-player"]').trigger('timeupdate', { 
        currentTime: 54, // 90% de 60 minutes
        duration: 60 
      });

      cy.wait('@updateProgress');

      // Vérifier que la progression est mise à jour
      cy.get('[data-testid="chapter-progress-detail"]').should('contain', '90%');
    });

    it('devrait enregistrer la position de lecture de la vidéo', () => {
      cy.visit('/student/chapters/2');

      // Simuler l'arrêt de la vidéo à 30 minutes
      cy.get('[data-testid="video-player"]').trigger('pause', { currentTime: 30 });

      // Recharger la page
      cy.reload();
      cy.wait('@getChapter1');

      // Vérifier que la vidéo reprend à la bonne position
      cy.get('[data-testid="video-player"]').should(($video) => {
        expect($video[0].currentTime).to.be.closeTo(30, 5);
      });

      // Vérifier l'affichage du point de reprise
      cy.contains('Reprendre à 30:00').should('be.visible');
    });

    it('devrait permettre de marquer un chapitre comme terminé', () => {
      cy.visit('/student/chapters/2');

      // Terminer le visionnage de la vidéo
      cy.get('[data-testid="video-player"]').trigger('ended');

      // Vérifier l'apparition du bouton de completion
      cy.get('[data-testid="mark-complete-btn"]').should('be.visible');
      cy.get('[data-testid="mark-complete-btn"]').click();

      cy.wait('@updateProgress');

      // Vérifier la confirmation
      cy.contains('Chapitre terminé !').should('be.visible');
      cy.get('[data-testid="completion-badge"]').should('be.visible');

      // Vérifier les suggestions du chapitre suivant
      cy.get('[data-testid="next-chapter-suggestion"]').should('be.visible');
      cy.get('[data-testid="continue-to-next-btn"]').should('be.visible');
    });
  });

  describe('Gestion des exercices', () => {
    beforeEach(() => {
      cy.loginAsStudent();
      cy.intercept('POST', '**/api/chapters/*/exercises/*/submit', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            is_correct: true,
            score: 20,
            explanation: "Excellente réponse ! (3+2i) + (1-4i) = (3+1) + (2-4)i = 4-2i"
          }
        }
      }).as('submitExercise');
    });

    it('devrait permettre de faire un exercice interactif', () => {
      cy.visit('/student/chapters/1');
      cy.wait('@getChapter1');
      
      cy.get('[data-testid="exercises-tab"]').click();
      cy.wait('@getExercises');

      // Commencer un exercice
      cy.get('[data-testid="start-exercise-btn"]').first().click();

      // Vérifier l'interface de l'exercice
      cy.get('[data-testid="exercise-question"]').should('contain', 'Calculez (3+2i) + (1-4i)');
      cy.get('[data-testid="exercise-options"]').should('be.visible');
      cy.get('[data-testid="option-button"]').should('have.length', 4);

      // Sélectionner une réponse
      cy.get('[data-testid="option-button"]').contains('4-2i').click();

      // Soumettre la réponse
      cy.get('[data-testid="submit-answer-btn"]').click();

      cy.wait('@submitExercise');

      // Vérifier le feedback
      cy.get('[data-testid="exercise-result"]').should('be.visible');
      cy.contains('Excellente réponse !').should('be.visible');
      cy.get('[data-testid="score-display"]').should('contain', '20/20');
      cy.get('[data-testid="explanation"]').should('be.visible');

      // Passer à l'exercice suivant
      cy.get('[data-testid="next-exercise-btn"]').should('be.visible');
    });

    it('devrait afficher les statistiques des exercices', () => {
      cy.visit('/student/chapters/1');
      cy.wait('@getChapter1');
      
      cy.get('[data-testid="exercises-tab"]').click();
      cy.wait('@getExercises');

      // Vérifier les statistiques globales
      cy.get('[data-testid="exercise-stats"]').within(() => {
        cy.contains('12/12 exercices complétés').should('be.visible');
        cy.contains('Score moyen: 17.5/20').should('be.visible');
        cy.contains('100% de réussite').should('be.visible');
      });

      // Vérifier l'historique des tentatives
      cy.get('[data-testid="exercise-history"]').should('be.visible');
      cy.get('[data-testid="exercise-attempt"]').should('have.length.at.least', 1);
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de chargement des chapitres', () => {
      // Simuler une erreur API
      cy.intercept('GET', '**/api/chapters', {
        statusCode: 500,
        body: { error: 'Erreur serveur' }
      }).as('failedChapters');

      cy.loginAsStudent();
      cy.visit('/student/chapters');

      cy.wait('@failedChapters');

      // Vérifier l'affichage de l'erreur
      cy.contains('Erreur lors du chargement des chapitres').should('be.visible');
      cy.get('[data-testid="retry-chapters-btn"]').should('be.visible');

      // Tester le bouton de retry
      cy.intercept('GET', '**/api/chapters', { fixture: 'chapters.json' }).as('retryChapters');
      cy.get('[data-testid="retry-chapters-btn"]').click();
      
      cy.wait('@retryChapters');
      cy.get('[data-testid="chapter-card"]').should('have.length', 6);
    });

    it('devrait gérer les erreurs de lecture vidéo', () => {
      cy.loginAsStudent();
      cy.visit('/student/chapters/1');
      cy.wait('@getChapter1');

      // Simuler une erreur de lecture vidéo
      cy.get('[data-testid="video-player"]').trigger('error');

      // Vérifier l'affichage de l'erreur
      cy.contains('Erreur lors de la lecture de la vidéo').should('be.visible');
      cy.get('[data-testid="retry-video-btn"]').should('be.visible');
      cy.get('[data-testid="report-issue-btn"]').should('be.visible');
    });
  });

  describe('Accessibilité et responsive', () => {
    beforeEach(() => {
      cy.loginAsStudent();
    });

    it('devrait être accessible au clavier', () => {
      cy.visit('/student/chapters');
      cy.wait('@getChapters');

      // Navigation au clavier
      cy.get('body').type('{tab}');
      cy.focused().should('have.attr', 'data-testid', 'difficulty-filter');

      // Utiliser les flèches pour naviguer entre les chapitres
      cy.get('[data-testid="chapter-1"]').focus();
      cy.focused().type('{enter}');
      
      cy.url().should('include', '/student/chapters/1');
    });

    it('devrait être responsive sur mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/student/chapters');
      cy.wait('@getChapters');

      // Vérifier l'adaptation mobile
      cy.get('[data-testid="mobile-chapter-list"]').should('be.visible');
      cy.get('[data-testid="chapter-card"]').should('have.css', 'width').and('match', /100%|calc/);

      // Vérifier les filtres sur mobile
      cy.get('[data-testid="mobile-filters-btn"]').click();
      cy.get('[data-testid="mobile-filters-modal"]').should('be.visible');
    });
  });
});
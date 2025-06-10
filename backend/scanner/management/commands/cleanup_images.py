from django.core.management.base import BaseCommand
from scanner.views import cleanup_business_card_images

class Command(BaseCommand):
    help = 'Clean up all stored business card images'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force cleanup without confirmation',
        )

    def handle(self, *args, **options):
        if not options['force']:
            confirm = input('This will delete all business card images. Are you sure? (y/N): ')
            if confirm.lower() != 'y':
                self.stdout.write(self.style.WARNING('Cleanup cancelled.'))
                return

        self.stdout.write('Starting image cleanup...')
        
        try:
            deleted_count = cleanup_business_card_images()
            self.stdout.write(
                self.style.SUCCESS(f'Successfully cleaned up {deleted_count} image files.')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error during cleanup: {str(e)}')
            ) 
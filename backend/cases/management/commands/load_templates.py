# cases/management/commands/load_templates.py
# Create these directories first:
# - cases/management/
# - cases/management/commands/
# Add __init__.py in each directory

from django.core.management.base import BaseCommand
from cases.models import TemplateRegistry
import json

class Command(BaseCommand):
    help = 'Load initial templates into the database'

    def handle(self, *args, **kwargs):
        templates = [
            {
                'template_id': 'beacon',
                'name': 'Beacon Template',
                'description': 'Clean, modern design with focus on awareness and finding answers',
                'version': '1.0.0',
                'schema': {
                    'global': {
                        'logo': {
                            'type': 'image',
                            'label': 'Memorial Logo',
                            'required': False
                        },
                        'primaryColor': {
                            'type': 'color',
                            'label': 'Primary Color',
                            'default': '#FFD700'
                        },
                        'fontFamily': {
                            'type': 'select',
                            'label': 'Font Family',
                            'options': ['Inter', 'Roboto', 'Open Sans', 'Lato'],
                            'default': 'Inter'
                        }
                    },
                    'sections': {
                        'hero': {
                            'heroTagline': {
                                'type': 'text',
                                'label': 'Hero Tagline',
                                'default': 'Help us find answers and bring justice to our family',
                                'maxLength': 150
                            },
                            'heroDescription': {
                                'type': 'richtext',
                                'label': 'Hero Description',
                                'default': '',
                                'maxLength': 500
                            },
                            'showRewardBanner': {
                                'type': 'boolean',
                                'label': 'Show Reward Amount in Hero',
                                'default': True
                            }
                        },
                        'about': {
                            'aboutTitle': {
                                'type': 'text',
                                'label': 'About Section Title',
                                'default': 'About',
                                'maxLength': 100
                            },
                            'aboutContent': {
                                'type': 'richtext',
                                'label': 'About Content',
                                'default': '',
                                'maxLength': 2000
                            },
                            'showPhysicalDescription': {
                                'type': 'boolean',
                                'label': 'Show Physical Description',
                                'default': True
                            },
                            'galleryImages': {
                                'type': 'gallery',
                                'label': 'Photo Gallery',
                                'maxItems': 50
                            }
                        },
                        'spotlight': {
                            'enabled': {
                                'type': 'boolean',
                                'label': 'Enable Spotlight Updates',
                                'default': True
                            },
                            'title': {
                                'type': 'text',
                                'label': 'Spotlight Section Title',
                                'default': 'Latest Updates',
                                'maxLength': 100
                            }
                        },
                        'contact': {
                            'showFamilyContact': {
                                'type': 'boolean',
                                'label': 'Show Family Contact Info',
                                'default': False
                            },
                            'familyPhone': {
                                'type': 'tel',
                                'label': 'Family Phone Number',
                                'required': False
                            },
                            'familyEmail': {
                                'type': 'email',
                                'label': 'Family Email',
                                'required': False
                            },
                            'contactMessage': {
                                'type': 'richtext',
                                'label': 'Contact Page Message',
                                'default': 'Your information could be the key to solving this case',
                                'maxLength': 500
                            }
                        },
                        'familyMessage': {
                            'enabled': {
                                'type': 'boolean',
                                'label': 'Show Family Message Section',
                                'default': True
                            },
                            'title': {
                                'type': 'text',
                                'label': 'Message Title',
                                'default': 'A Message from the Family',
                                'maxLength': 100
                            },
                            'message': {
                                'type': 'richtext',
                                'label': 'Family Message',
                                'default': '',
                                'maxLength': 1000
                            }
                        }
                    }
                },
                'features': ['spotlight', 'gallery', 'contact_form', 'tip_submission'],
                'components': {
                    'layout': 'beacon/Layout',
                    'home': 'beacon/Home',
                    'about': 'beacon/About',
                    'contact': 'beacon/Contact',
                    'spotlight': 'beacon/Spotlight'
                },
                'is_active': True,
                'is_premium': False
            },
            {
                'template_id': 'justice',
                'name': 'Justice Template',
                'description': 'Professional template focused on law enforcement cooperation',
                'version': '1.0.0',
                'schema': {
                    'global': {
                        'primaryColor': {
                            'type': 'color',
                            'label': 'Primary Color',
                            'default': '#DC2626'
                        },
                        'badgeNumber': {
                            'type': 'text',
                            'label': 'Badge/Case Number Display',
                            'default': ''
                        }
                    },
                    'sections': {
                        'caseFacts': {
                            'title': {
                                'type': 'text',
                                'label': 'Case Facts Title',
                                'default': 'Case Facts'
                            },
                            'showCaseNumber': {
                                'type': 'boolean',
                                'label': 'Display Case Number',
                                'default': True
                            },
                            'showTimeline': {
                                'type': 'boolean',
                                'label': 'Show Investigation Timeline',
                                'default': True
                            }
                        },
                        'evidence': {
                            'showEvidence': {
                                'type': 'boolean',
                                'label': 'Show Evidence Section',
                                'default': False
                            },
                            'evidenceTitle': {
                                'type': 'text',
                                'label': 'Evidence Section Title',
                                'default': 'Key Evidence'
                            }
                        },
                        'lawEnforcement': {
                            'departmentLogo': {
                                'type': 'image',
                                'label': 'Department Logo',
                                'required': False
                            },
                            'contactMessage': {
                                'type': 'richtext',
                                'label': 'Law Enforcement Message',
                                'default': 'Contact law enforcement with any information'
                            }
                        }
                    }
                },
                'features': ['case_facts', 'evidence', 'law_enforcement', 'timeline'],
                'is_active': True,
                'is_premium': False
            },
            {
                'template_id': 'legacy',
                'name': 'Legacy Template',
                'description': 'Memorial template celebrating life and memories',
                'version': '1.0.0',
                'schema': {
                    'global': {
                        'primaryColor': {
                            'type': 'color',
                            'label': 'Primary Color',
                            'default': '#7C3AED'
                        },
                        'memorialTheme': {
                            'type': 'select',
                            'label': 'Memorial Theme',
                            'options': ['celebration', 'remembrance', 'tribute'],
                            'default': 'remembrance'
                        }
                    },
                    'sections': {
                        'lifeStory': {
                            'narrative': {
                                'type': 'richtext',
                                'label': 'Life Story',
                                'default': '',
                                'maxLength': 5000
                            },
                            'birthPlace': {
                                'type': 'text',
                                'label': 'Birth Place',
                                'default': ''
                            },
                            'favoriteQuote': {
                                'type': 'text',
                                'label': 'Favorite Quote',
                                'default': '',
                                'maxLength': 200
                            }
                        },
                        'memorialWall': {
                            'allowGuestPosts': {
                                'type': 'boolean',
                                'label': 'Allow Guest Messages',
                                'default': True
                            },
                            'moderateMessages': {
                                'type': 'boolean',
                                'label': 'Moderate Messages Before Publishing',
                                'default': True
                            }
                        },
                        'photoAlbums': {
                            'albums': {
                                'type': 'array',
                                'label': 'Photo Albums',
                                'default': []
                            }
                        }
                    }
                },
                'features': ['memorial_wall', 'photo_albums', 'life_story', 'guestbook'],
                'is_active': True,
                'is_premium': True
            }
        ]
        
        for template_data in templates:
            template, created = TemplateRegistry.objects.update_or_create(
                template_id=template_data['template_id'],
                defaults=template_data
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created template: {template.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'↻ Updated template: {template.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Successfully loaded {len(templates)} templates')
        )
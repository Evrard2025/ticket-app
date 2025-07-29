import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';

const NotFound = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-6xl font-bold text-red-600 dark:text-red-400 mb-6">404</h1>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Page non trouvée</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="default" className="bg-red-600 hover:bg-red-700 text-white">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
            <Button asChild variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <Link to="/events">Parcourir les événements</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
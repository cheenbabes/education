import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">EduApp</h1>
        <p className="text-lg text-gray-600 max-w-md">
          Interest-driven lesson plans for homeschooling families.
          Powered by your child&apos;s curiosity.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}

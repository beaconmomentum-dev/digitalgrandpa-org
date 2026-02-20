import { useState, useEffect } from 'react'
import { 
  Shield, 
  Moon, 
  Brain, 
  Heart, 
  Star, 
  CheckCircle, 
  Clock, 
  Users, 
  Award,
  Download,
  Play,
  FileText,
  Mail,
  Phone,
  ArrowRight,
  Quote,
  Zap,
  Target,
  TrendingUp,
  Lock,
  Gift
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { motion } from 'framer-motion'
import './App.css'

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

// Hero Section Component
function HeroSection() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 47,
    seconds: 32
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {/* Digital Grandpa Badge */}
          <motion.div variants={fadeInUp} className="mb-8">
            <Badge className="bg-blue-600 text-white px-6 py-2 text-lg font-semibold">
              <Shield className="w-5 h-5 mr-2" />
              Digital Grandpa Store
            </Badge>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            The Strategic Rest
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Protocol
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            variants={fadeInUp}
            className="text-xl md:text-2xl mb-8 text-gray-300 leading-relaxed"
          >
            Military-Tested Recovery Science for Life Rebuilders
          </motion.p>

          {/* Quote */}
          <motion.div 
            variants={fadeInUp}
            className="mb-12 p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
          >
            <Quote className="w-8 h-8 text-blue-400 mb-4 mx-auto" />
            <p className="text-lg italic text-gray-200">
              "Your biggest breakthrough might be waiting on the other side of a good night's sleep."
            </p>
            <p className="text-sm text-gray-400 mt-4">
              - Bob Burr, "Digital Grandpa" | U.S. Navy Veteran | Founder of Rise & Reclaim Community
            </p>
          </motion.div>

          {/* Limited Time Offer */}
          <motion.div 
            variants={fadeInUp}
            className="mb-8 p-6 bg-red-600/20 backdrop-blur-sm rounded-lg border border-red-500/30"
          >
            <div className="flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-red-400 mr-2" />
              <span className="text-red-400 font-semibold">LIMITED TIME OFFER</span>
            </div>
            <div className="flex justify-center space-x-4 text-2xl font-bold">
              <div className="text-center">
                <div className="bg-red-600 px-3 py-2 rounded">{timeLeft.hours.toString().padStart(2, '0')}</div>
                <div className="text-xs text-gray-400 mt-1">Hours</div>
              </div>
              <div className="text-center">
                <div className="bg-red-600 px-3 py-2 rounded">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                <div className="text-xs text-gray-400 mt-1">Minutes</div>
              </div>
              <div className="text-center">
                <div className="bg-red-600 px-3 py-2 rounded">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                <div className="text-xs text-gray-400 mt-1">Seconds</div>
              </div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Download className="w-5 h-5 mr-2" />
              Get Instant Access - $67
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Preview
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            variants={fadeInUp}
            className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400"
          >
            <div className="flex items-center">
              <Lock className="w-4 h-4 mr-2" />
              Secure Payment
            </div>
            <div className="flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Instant Download
            </div>
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              60-Day Guarantee
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// Problem Section Component
function ProblemSection() {
  const problems = [
    {
      icon: Brain,
      title: "Exhausted Mind",
      description: "You're working harder than most people but making terrible decisions because your brain is fried"
    },
    {
      icon: Heart,
      title: "Emotional Drain",
      description: "Constantly managing others' reactions to your situation while fighting your own battles"
    },
    {
      icon: Clock,
      title: "Time Trap",
      description: "Grinding 16-hour days trying to rebuild but feeling like you're moving backwards"
    },
    {
      icon: Target,
      title: "Wrong Battle",
      description: "Fighting fatigue with more work, confusion with more analysis, stress with more stress"
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <motion.div 
          className="max-w-4xl mx-auto text-center mb-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Are You Exhausted From Fighting But Not Winning?
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            If you're reading this, chances are you're tired of being tired. You're not lazy, weak, or giving up. 
            But you're fighting the wrong battle.
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {problems.map((problem, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="h-full text-center p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <problem.icon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">{problem.title}</h3>
                  <p className="text-gray-600">{problem.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="mt-16 text-center"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-red-800 mb-4">The Battle You Didn't Know You Were Losing</h3>
            <p className="text-lg text-red-700 leading-relaxed">
              For years, Bob believed rest was for the weak. In the Navy, they pushed through exhaustion. 
              During rebuilding after losing everything in 9/11, he thought grinding harder was the answer. 
              He was wrong. He was losing the battle for his own mind - and didn't even know he was fighting it.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Solution Section Component
function SolutionSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <motion.div 
          className="max-w-4xl mx-auto text-center mb-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            The $47,000 Discovery That Changed Everything
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            After hitting rock bottom, Bob invested $47,000 in personal development, business training, 
            and recovery programs trying to rebuild his life. Most of it was garbage.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <Zap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-blue-800 mb-4">The Breakthrough Discovery</h3>
            <p className="text-lg text-blue-700 leading-relaxed">
              The most successful people aren't those who work the hardest - they're those who recover the smartest.
            </p>
          </div>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-3 gap-8 mb-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <Card className="text-center p-6 h-full">
              <CardContent className="pt-6">
                <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Elite Military Units</h3>
                <p className="text-gray-600">
                  Operate on strict rest protocols because tired soldiers make fatal mistakes
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="text-center p-6 h-full">
              <CardContent className="pt-6">
                <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Top Athletes</h3>
                <p className="text-gray-600">
                  Prioritize recovery as much as training because exhausted bodies break down
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="text-center p-6 h-full">
              <CardContent className="pt-6">
                <TrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Successful Entrepreneurs</h3>
                <p className="text-gray-600">
                  Protect their mental energy like their most valuable asset
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div 
          className="text-center"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg p-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Strategic Rest: Your Secret Weapon</h3>
            <p className="text-lg leading-relaxed">
              Not the "self-care" bubble bath nonsense. Not the "just relax" advice that ignores reality. 
              Military-grade recovery protocols that treat rest as a tactical advantage, not a moral failing.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Features Section Component
function FeaturesSection() {
  const chapters = [
    {
      number: "01",
      title: "Why Strong People Rest (And Why Weak People Don't)",
      description: "The military truth about rest as tactical advantage and why your exhaustion is sabotaging your rebuilding efforts",
      icon: Shield
    },
    {
      number: "02", 
      title: "The Nine Types of Strategic Rest",
      description: "Physical, Mental, Sensory, Creative, Emotional, Social, Spiritual, Digital, and Nature Rest protocols",
      icon: Brain
    },
    {
      number: "03",
      title: "The Warrior's Sleep Protocol", 
      description: "Complete evening-to-morning sleep system for rebuilders with racing minds",
      icon: Moon
    },
    {
      number: "04",
      title: "The Daily Rest Battle Plan",
      description: "24-hour rest rhythm for sustainable energy and weekly architecture that builds momentum",
      icon: Clock
    },
    {
      number: "05",
      title: "Rest Tactics for Specific Challenges",
      description: "Specialized strategies for Veterans, Formerly Incarcerated, Failed Entrepreneurs, and Mental Health",
      icon: Target
    },
    {
      number: "06",
      title: "The Compound Effect of Strategic Rest",
      description: "How rest transforms every area of your life with 30-day, 90-day, and 1-year timelines",
      icon: TrendingUp
    },
    {
      number: "07",
      title: "Your Implementation Plan",
      description: "Week-by-week action plan with 30-day challenge and quick reference guides",
      icon: CheckCircle
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <motion.div 
          className="max-w-4xl mx-auto text-center mb-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            What You'll Discover in The Strategic Rest Protocol
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            This isn't another self-help book telling you to "just relax." This is a tactical manual 
            for using rest as a strategic weapon in your comeback.
          </p>
        </motion.div>

        <motion.div 
          className="space-y-8"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {chapters.map((chapter, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                      {chapter.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-900">{chapter.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{chapter.description}</p>
                      </div>
                      <chapter.icon className="w-8 h-8 text-blue-600 ml-4 flex-shrink-0" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// Testimonials Section Component
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Michael R.",
      title: "Army Veteran",
      quote: "I thought rest was giving up. Bob showed me rest is gearing up. My decision-making improved dramatically once I stopped running on empty.",
      rating: 5
    },
    {
      name: "Sarah T.",
      title: "Entrepreneur",
      quote: "After my business failed, I was grinding 16-hour days trying to rebuild. This guide taught me that my exhaustion was the problem, not the solution. Game changer.",
      rating: 5
    },
    {
      name: "David L.",
      title: "Father of Three",
      quote: "The sleep protocol alone was worth 10x the price. I haven't slept this well in years, and my family has noticed I'm not constantly irritable anymore.",
      rating: 5
    },
    {
      name: "Jennifer M.",
      title: "Single Mother",
      quote: "Strategic rest sounds like an oxymoron, but Bob proves it works. I'm accomplishing more by doing less - and I actually enjoy my life again.",
      rating: 5
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <motion.div 
          className="max-w-4xl mx-auto text-center mb-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            What People Are Saying
          </h2>
          <p className="text-xl text-gray-600">
            Real results from real people who've implemented the Strategic Rest Protocol
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 gap-8"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="p-6 h-full">
                <CardContent>
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-4 italic leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-gray-600 text-sm">{testimonial.title}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// Pricing Section Component
function PricingSection() {
  const bonuses = [
    {
      title: "Audio Version",
      value: "$47",
      description: "Complete guide narrated by Digital Grandpa himself. Listen while walking, driving, or during rest breaks.",
      icon: Play
    },
    {
      title: "Quick Reference Cards", 
      value: "$27",
      description: "Printable cards for each type of rest with specific actions you can take immediately.",
      icon: FileText
    },
    {
      title: "30-Day Email Support",
      value: "$73", 
      description: "Additional encouragement, tips, and accountability delivered to your inbox for 30 days.",
      icon: Mail
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      <div className="container mx-auto px-6">
        <motion.div 
          className="max-w-4xl mx-auto text-center mb-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Your Investment
          </h2>
          <p className="text-xl text-gray-300 leading-relaxed">
            Bob could charge $497 for this guide and it would be worth every penny. 
            But his mission isn't to get rich - it's to help people rise.
          </p>
        </motion.div>

        <motion.div 
          className="max-w-4xl mx-auto"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          {/* Main Offer */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-8 mb-8">
            <CardContent>
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <span className="text-3xl text-gray-400 line-through mr-4">$497</span>
                  <span className="text-6xl font-bold text-green-400">$67</span>
                </div>
                <p className="text-xl text-gray-300">Today Only - Save $430!</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">What You Get:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                      Complete 127-page guide with 7 comprehensive chapters
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                      Military-tested recovery protocols
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                      9 types of strategic rest framework
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                      Complete sleep optimization system
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                      Daily and weekly implementation plans
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Perfect For:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-blue-400 mr-3" />
                      Veterans transitioning to civilian life
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-blue-400 mr-3" />
                      Entrepreneurs recovering from failure
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-blue-400 mr-3" />
                      Formerly incarcerated rebuilding lives
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-blue-400 mr-3" />
                      Anyone tired of "hustle culture"
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-blue-400 mr-3" />
                      People ready for sustainable success
                    </li>
                  </ul>
                </div>
              </div>

              <div className="text-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-12 py-4 text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Download className="w-6 h-6 mr-3" />
                  Get Instant Access - $67
                </Button>
                <p className="text-sm text-gray-400 mt-4">
                  Secure payment • Instant digital delivery • 60-day guarantee
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bonuses */}
          <motion.div 
            className="mb-8"
            variants={staggerContainer}
          >
            <h3 className="text-3xl font-bold text-center mb-8">
              Three Powerful Bonuses <span className="text-green-400">(Worth $147)</span>
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {bonuses.map((bonus, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 h-full">
                    <CardContent className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <bonus.icon className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-xl font-semibold mb-2">{bonus.title}</h4>
                      <div className="text-2xl font-bold text-green-400 mb-3">{bonus.value} Value</div>
                      <p className="text-gray-300 text-sm">{bonus.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Guarantee */}
          <motion.div 
            className="text-center"
            variants={fadeInUp}
          >
            <Card className="bg-green-600/20 backdrop-blur-sm border border-green-500/30 p-8">
              <CardContent>
                <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">60-Day Money-Back Guarantee</h3>
                <p className="text-lg text-gray-300 leading-relaxed">
                  Try the Strategic Rest Protocol for 60 full days. If you don't sleep better, think clearer, 
                  make better decisions, and feel more energized, just email Bob and he'll refund every penny. 
                  You can even keep the guide and bonuses as his gift for giving it an honest try.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// FAQ Section Component
function FAQSection() {
  const faqs = [
    {
      question: "I'm not military - will this still work for me?",
      answer: "Absolutely. The military examples provide context, but the rest protocols work for anyone rebuilding their life. Bob has tested these with entrepreneurs, parents, students, and people from all backgrounds."
    },
    {
      question: "I don't have time to read another book.",
      answer: "This isn't a book you read - it's a system you implement. Start with just 10 minutes of daily rest and build from there. The audio version lets you learn while walking, driving, or doing other activities."
    },
    {
      question: "I've tried other sleep and rest advice before.",
      answer: "Most rest advice treats the symptoms, not the cause. This guide addresses why your rest isn't working and gives you strategic alternatives beyond just 'sleep more.'"
    },
    {
      question: "Is this religious or faith-based?",
      answer: "There are optional faith elements for those who want them, but the core strategies work regardless of your spiritual beliefs. The science is universal."
    },
    {
      question: "What if I have serious sleep disorders or mental health issues?",
      answer: "This guide complements professional treatment but doesn't replace it. Bob specifically addresses when to seek professional help and how these strategies support other treatments."
    },
    {
      question: "How is this different from other rest/sleep books?",
      answer: "Most books are written by academics or people who've never faced real hardship. This comes from someone who rebuilt from rock bottom and understands what it's like when 'just relax' isn't realistic advice."
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <motion.div 
          className="max-w-4xl mx-auto text-center mb-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Common Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about the Strategic Rest Protocol
          </p>
        </motion.div>

        <motion.div 
          className="max-w-3xl mx-auto space-y-6"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {faqs.map((faq, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="p-6">
                <CardContent>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">{faq.question}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// Final CTA Section Component
function FinalCTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      <div className="container mx-auto px-6">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Don't Wait Until You're More Exhausted
          </h2>
          
          <div className="space-y-6 mb-12 text-lg text-gray-300">
            <p>Every day you delay is another day of making important decisions while running on empty.</p>
            <p>Another day of missing opportunities because you're too tired to see them.</p>
            <p>Another day of being irritable with people you love because your nervous system is fried.</p>
            <p>Another day of wondering why you're working so hard but not getting ahead.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-12">
            <h3 className="text-2xl font-bold mb-4">The Strategic Rest Protocol is available right now.</h3>
            <p className="text-xl text-blue-300">Your transformation can start today.</p>
          </div>

          <Button 
            size="lg" 
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-12 py-6 text-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mb-8"
          >
            <Download className="w-8 h-8 mr-4" />
            Get Instant Access Now - $67
          </Button>

          <div className="border-t border-white/20 pt-12">
            <h3 className="text-2xl font-bold mb-6">One Final Thought</h3>
            <div className="text-lg text-gray-300 leading-relaxed space-y-4">
              <p>
                Friend, Bob has been where you are. He knows what it's like to be so tired you can barely think straight 
                but feel like you can't afford to rest.
              </p>
              <p>
                He knows what it's like to work harder than everyone around you but feel like you're moving backwards.
              </p>
              <p>
                He knows what it's like to be strong enough to survive anything but too exhausted to thrive.
              </p>
              <p className="text-xl text-blue-300 font-semibold">
                There's a better way.
              </p>
              <p>
                The strongest warriors aren't those who never rest - they're those who rest strategically 
                so they can fight the battles that actually matter.
              </p>
              <p>
                Your comeback doesn't have to cost you your health, your relationships, or your sanity.
              </p>
              <p className="text-xl text-green-400 font-semibold">
                Let Bob show you how to rise smarter, not just harder.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8 text-sm text-gray-400">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                director@digitalgrandpa.org
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                413-603-8478
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                DigitalGrandpa.org
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Bob Burr - "Digital Grandpa" | U.S. Navy Veteran | Founder, Rise & Reclaim Community
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Main App Component
function App() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
    </div>
  )
}

export default App

